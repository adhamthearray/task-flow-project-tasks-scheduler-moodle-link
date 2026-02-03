"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import "./signup.css";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setError("");
    setLoading(true);

    // 1️⃣ Create auth user
   const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      username, // 👈 goes into raw_user_meta_data
    },
  },
});


    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // 2️⃣ Create profile row
    
    setLoading(false);

   

    router.push("/login");
  };

  return (
    <div className="signup-page">
      <div className="signup-card">
        <h1 className="signup-title">TaskFlow</h1>
        <p className="signup-subtitle">Create your account</p>

        {error && <p className="signup-error">{error}</p>}

        {/* 👤 USERNAME */}
        <input
          className="signup-input"
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        {/* 📧 EMAIL */}
        <input
          className="signup-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* 🔐 PASSWORD */}
        <input
          className="signup-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="signup-button"
          onClick={handleSignup}
          disabled={loading || !email || !password || !username}
        >
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        <p className="signup-footer">
          Already have an account?{" "}
          <span onClick={() => router.push("/login")}>
            Log in
          </span>
        </p>
      </div>
    </div>
  );
}
