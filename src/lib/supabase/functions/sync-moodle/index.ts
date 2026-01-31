import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function getCurrentTerm() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  if (month >= 9 || month === 1) {
    return { season: "Fall", year: month === 1 ? year - 1 : year };
  }

  if (month >= 2 && month <= 6) {
    return { season: "Spring", year };
  }

  return { season: "Summer", year };
}

serve(async (req) => {
  // ✅ CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const jwt = req.headers
      .get("Authorization")
      ?.replace("Bearer ", "");

    if (!jwt) {
      return new Response("Unauthorized", {
        status: 401,
        headers: corsHeaders,
      });
    }

    const {
      data: { user },
    } = await supabase.auth.getUser(jwt);

    if (!user) {
      return new Response("Unauthorized", {
        status: 401,
        headers: corsHeaders,
      });
    }

    // 🔐 Get stored token
    const { data: conn } = await supabase
      .from("moodle_connections")
      .select("token")
      .eq("user_id", user.id)
      .single();

    if (!conn) {
      return new Response("Moodle not connected", {
        status: 400,
        headers: corsHeaders,
      });
    }

    const token = conn.token;

    // 📚 Fetch courses
    const coursesRes = await fetch(
      `https://lms.eng.asu.edu.eg/webservice/rest/server.php` +
        `?wstoken=${token}` +
        `&wsfunction=core_enrol_get_users_courses` +
        `&moodlewsrestformat=json`
    );

    const courses = await coursesRes.json();

    const { season, year } = getCurrentTerm();
    const termString = `${season} ${year}`;

    const currentCourses = courses.filter(
      (c) => c.summary && c.summary.includes(`Term: ${termString}`)
    );

    for (const course of currentCourses) {
      // 🧱 Project
      const { data: existingProject } = await supabase
        .from("projects")
        .select("id")
        .eq("moodle_course_id", course.id)
        .eq("user_id", user.id)
        .single();

      let projectId = existingProject?.id;

      if (!projectId) {
        const { data: newProject } = await supabase
          .from("projects")
          .insert({
            user_id: user.id,
            name: course.fullname,
            source: "MOODLE",
            moodle_course_id: course.id,
          })
          .select()
          .single();

        projectId = newProject.id;
      }

      // 📝 Assignments
      const assignRes = await fetch(
        `https://lms.eng.asu.edu.eg/webservice/rest/server.php` +
          `?wstoken=${token}` +
          `&wsfunction=mod_assign_get_assignments` +
          `&moodlewsrestformat=json` +
          `&courseids[0]=${course.id}`
      );

      const assignData = await assignRes.json();
      const assignments =
        assignData?.courses?.[0]?.assignments ?? [];

      for (const a of assignments) {
        const { data: exists } = await supabase
          .from("tasks")
          .select("id")
          .eq("moodle_assignment_id", a.id)
          .single();

        if (exists) continue;

        await supabase.from("tasks").insert({
          user_id: user.id,
          project_id: projectId,
          title: a.name,
          due_date: a.duedate
            ? new Date(a.duedate * 1000).toISOString()
            : null,
          priority: 2,
          status: "todo",
          moodle_assignment_id: a.id,
        });
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
