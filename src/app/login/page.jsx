"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import "./login.css";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }
    router.push("/dashboard");
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">TaskFlow</h1>
        <p className="login-subtitle">Log in to your account</p>

        {error && <p className="login-error">{error}</p>}

        <input
          className="login-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="login-input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="login-button"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Log In"}
        </button>

        <p className="login-footer">
          Don’t have an account?{" "}
          <span onClick={() => router.push("/signup")}>
            Sign up
          </span>
        </p>
      </div>
    </div>
  );
}
