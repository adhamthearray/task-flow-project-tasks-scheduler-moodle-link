import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform",
};


serve(async (req) => {
  // ✅ CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const { token } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token required" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // 🔐 Supabase client (user context)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: {
            Authorization: req.headers.get("Authorization")!,
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user || authError) {
      return new Response("Unauthorized", {
        status: 401,
        headers: corsHeaders,
      });
    }

    // 🔍 Validate Moodle token
    const moodleRes = await fetch(
      `https://lms.eng.asu.edu.eg/webservice/rest/server.php` +
        `?wstoken=${token}` +
        `&wsfunction=core_webservice_get_site_info` +
        `&moodlewsrestformat=json`
    );

    const moodleData = await moodleRes.json();

    if (moodleData?.errorcode) {
      return new Response(
        JSON.stringify({ error: "Invalid Moodle token" }),
        { status: 401, headers: corsHeaders }
      );
    }

    // 💾 Save token
    const { error: dbError } = await supabase
      .from("moodle_connections")
      .upsert({
        user_id: user.id,
        token,
      });

    if (dbError) throw dbError;

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