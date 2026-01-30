import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabase = createClient(
    Deno.env.get("NEXT_PUBLIC_SUPABASE_URL"),
    Deno.env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      global: {
        headers: {
          Authorization: req.headers.get("Authorization"),
        },
      },
    }
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { token } = await req.json();

  if (!token) {
    return new Response("Token required", { status: 400 });
  }

  const { error } = await supabase
    .from("moodle_connections")
    .upsert({
      user_id: user.id,
      encrypted_token: token,
    });

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  return new Response(
    JSON.stringify({ connected: true }),
    { headers: { "Content-Type": "application/json" } }
  );
});
