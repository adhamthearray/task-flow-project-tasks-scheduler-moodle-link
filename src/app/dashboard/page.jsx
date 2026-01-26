"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import "./dashboard.css";

export default function Dashboard() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
const [newProjectName, setNewProjectName] = useState("");
const [creating, setCreating] = useState(false);

  // 🔹 EFFECT 1: get user
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setUser(user);
      setLoading(false);
    };

    getUser();
  }, [router]);

  // 🔹 EFFECT 2: load projects (depends on user)
  useEffect(() => {
    if (!user) return;

    const loadProjects = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("user_id", user.id);

      if (error) {
        console.error(error);
        return;
      }

      setProjects(data);
    };

    loadProjects();
  }, [user]);

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="dashboard">
      <header className="topbar">
        <h1>TaskFlow</h1>
        <button
          className="logout-btn"
          onClick={async () => {
            await supabase.auth.signOut();
            router.push("/login");
          }}
        >
          Logout
        </button>
      </header>

      <div className="content">
        <aside className="sidebar">
          <h3>Projects</h3>
          <ul>
            {projects.map((project) => (
              <li key={project.id}>{project.name}</li>
            ))}
          </ul>

          <button
  className="add-project"
  onClick={() => setShowModal(true)}
>
  + New Project
</button>

        </aside>

        <main className="main">
          <h2>Welcome back 👋</h2>
          <p className="email">{user.email}</p>
        </main>
      </div>
      {showModal && (
  <div className="modal-overlay">
    <div className="modal">
      <h2>Create Project</h2>

      <input
        type="text"
        placeholder="Project name"
        value={newProjectName}
        onChange={(e) => setNewProjectName(e.target.value)}
      />

      <div className="modal-actions">
        <button
          className="cancel"
          onClick={() => {
            setShowModal(false);
            setNewProjectName("");
          }}
        >
          Cancel
        </button>

        <button
          className="create"
          disabled={!newProjectName || creating}
          onClick={async () => {
            setCreating(true);

            const { data, error } = await supabase
              .from("projects")
              .insert({
                name: newProjectName,
                user_id: user.id,
                source: "MANUAL",
              })
              .select()
              .single();

            setCreating(false);

            if (error) {
              alert(error.message);
              return;
            }

            // update UI instantly
            setProjects((prev) => [...prev, data]);

            // reset + close
            setNewProjectName("");
            setShowModal(false);
          }}
        >
          {creating ? "Creating..." : "Create"}
        </button>
      </div>
    </div>
  </div>
)}

    </div>
    
  );
}
