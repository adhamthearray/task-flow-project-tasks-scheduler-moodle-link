import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decrypt } from "../_shared/crypto.ts";



const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
  // ✅ CORS preflight — REQUIRED
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const jwt = req.headers.get("Authorization")?.replace("Bearer ", "");
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

    const encryptedToken = conn.token;
const token = await decrypt(encryptedToken);


    // 🔎 Resolve Moodle user id
    const siteRes = await fetch(
      `https://lms.eng.asu.edu.eg/webservice/rest/server.php` +
        `?wstoken=${token}` +
        `&wsfunction=core_webservice_get_site_info` +
        `&moodlewsrestformat=json`
    );

    const site = await siteRes.json();
    const moodleUserId = site.userid;

    if (!moodleUserId) {
      throw new Error("Invalid Moodle token");
    }

    const coursesRes = await fetch(
      `https://lms.eng.asu.edu.eg/webservice/rest/server.php` +
        `?wstoken=${token}` +
        `&wsfunction=core_enrol_get_users_courses` +
        `&userid=${moodleUserId}` +
        `&moodlewsrestformat=json`
    );

    const courses = await coursesRes.json();
    if (!Array.isArray(courses)) {
      throw new Error("Failed to fetch Moodle courses");
    }

    const { season, year } = getCurrentTerm();
    const term = `${season} ${year}`;

    const filtered = courses.filter(
      (c) => c.summary && c.summary.includes(`Term: ${term}`)
    );

    for (const course of filtered) {
      let { data: project } = await supabase
        .from("projects")
        .select("id")
        .eq("moodle_course_id", course.id)
        .eq("user_id", user.id)
        .single();

      if (!project) {
        const { data: created } = await supabase
          .from("projects")
          .insert({
            user_id: user.id,
            name: course.fullname,
            source: "MOODLE",
            moodle_course_id: course.id,
          })
          .select()
          .single();

        project = created;
      }

      const assignRes = await fetch(
        `https://lms.eng.asu.edu.eg/webservice/rest/server.php` +
          `?wstoken=${token}` +
          `&wsfunction=mod_assign_get_assignments` +
          `&courseids[0]=${course.id}` +
          `&moodlewsrestformat=json`
      );

      const assignData = await assignRes.json();
      const assignments = assignData.courses?.[0]?.assignments ?? [];

      for (const a of assignments) {
        const { data: exists } = await supabase
          .from("tasks")
          .select("id")
          .eq("moodle_assignment_id", a.id)
          .single();

        if (!exists) {
          await supabase.from("tasks").insert({
            user_id: user.id,
            project_id: project.id,
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
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
});