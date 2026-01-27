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
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [tasks, settasks] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showDependencyModal, setShowDependencyModal] = useState(false);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState(2);
  const [creatingTask, setCreatingTask] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [dependencies, setDependencies] = useState([]);
  const [selectedDependencyId, setSelectedDependencyId] = useState(null);
  const [fromTaskId, setFromTaskId] = useState("");
  const [toTaskId, setToTaskId] = useState("");
  const [creatingDependency, setCreatingDependency] = useState(false);

  const [editTitle, setEditTitle] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editPriority, setEditPriority] = useState(2);
  const [updating, setUpdating] = useState(false);

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

  // 🔹 EFFECT 2: load projects
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

  // 🔹 load tasks
  useEffect(() => {
    if (!user || !selectedProjectId) return;

    const loadtasks = async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("project_id", selectedProjectId)
        .eq("user_id", user.id)
        .order("due_date", { ascending: true });

      if (error) {
        console.error(error);
        return;
      }

      settasks(data);
    };

    loadtasks();
  }, [selectedProjectId, user]);

  // 🔹 load dependencies
  useEffect(() => {
    if (!user || !selectedProjectId) return;

    const loadDependencies = async () => {
      const { data, error } = await supabase
        .from("task_dependencies")
        .select("*")
        .eq("project_id", selectedProjectId)
        .eq("user_id", user.id);

      if (error) {
        console.error(error);
        return;
      }

      setDependencies(data);
    };

    loadDependencies();
  }, [selectedProjectId, user]);

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
              <li
                key={project.id}
                onClick={() => setSelectedProjectId(project.id)}
                className={project.id === selectedProjectId ? "active" : ""}
              >
                {project.name}
              </li>
            ))}
          </ul>

          <button className="add-project" onClick={() => setShowModal(true)}>
            + New Project
          </button>
        </aside>

        <main className="main">
          <h2>Welcome back 👋</h2>
          <p className="email">{user.email}</p>

          <div className="task-actions">
            <button
              className="primary-btn"
              disabled={!selectedProjectId}
              onClick={() => setShowTaskModal(true)}
            >
              + Add Task
            </button>

            <button
              className="secondary-btn"
              disabled={!selectedProjectId}
              onClick={() => setShowDependencyModal(true)}
            >
              🔗 Declare Dependency
            </button>
          </div>

          <div className="tasks-flow">
            {tasks.map((task, index) => (
              <div key={task.id} className="task-flow-item">
                <div className={`task-card priority-${task.priority}`}>
                  <div className="task-header">
                    <h3>{task.title}</h3>
                    <span className={`priority-badge p${task.priority}`}>
                      P{task.priority}
                    </span>
                  </div>

                  <div className="task-footer">
                    <span className="due-date">
                      📅{" "}
                      {task.due_date
                        ? new Date(task.due_date).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "No due date"}
                    </span>

                    {/* ✅ EDIT & DELETE ARE BACK */}
                    <div className="task-actions-inline">
                      <button
                        className="edit-btn"
                        onClick={() => {
                          setEditingTask(task);
                          setEditTitle(task.title);
                          setEditDueDate(task.due_date ?? "");
                          setEditPriority(task.priority);
                          setShowEditModal(true);
                        }}
                      >
                        ✏️ Edit
                      </button>

                      <button
                        className="delete-btn"
                        onClick={async () => {
                          const confirmed = confirm("Delete this task?");
                          if (!confirmed) return;

                          const { error } = await supabase
                            .from("tasks")
                            .delete()
                            .eq("id", task.id);

                          if (error) {
                            alert(error.message);
                            return;
                          }

                          settasks((prev) =>
                            prev.filter((t) => t.id !== task.id)
                          );
                        }}
                      >
                        🗑 Delete
                      </button>
                    </div>
                  </div>
                </div>

                {index !== tasks.length - 1 && (
                  <div className="task-arrow">⬇</div>
                )}
              </div>
            ))}
          </div>
        </main>
      </div>
      {/* ================= CREATE PROJECT MODAL ================= */}
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

            setProjects((prev) => [...prev, data]);
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

{/* ================= ADD TASK MODAL ================= */}
{showTaskModal && (
  <div className="modal-overlay">
    <div className="modal">
      <h2>Add Task</h2>

      <input
        type="text"
        placeholder="Task title"
        value={newTaskTitle}
        onChange={(e) => setNewTaskTitle(e.target.value)}
      />

      <input
        type="date"
        value={newTaskDueDate}
        onChange={(e) => setNewTaskDueDate(e.target.value)}
      />

      <select
        value={newTaskPriority}
        onChange={(e) => setNewTaskPriority(Number(e.target.value))}
      >
        <option value={1}>Priority 1 (High)</option>
        <option value={2}>Priority 2 (Medium)</option>
        <option value={3}>Priority 3 (Low)</option>
      </select>

      <div className="modal-actions">
        <button
          className="cancel"
          onClick={() => {
            setShowTaskModal(false);
            setNewTaskTitle("");
            setNewTaskDueDate("");
            setNewTaskPriority(2);
          }}
        >
          Cancel
        </button>

        <button
          className="create"
          disabled={!newTaskTitle || !newTaskDueDate || creatingTask}
          onClick={async () => {
            setCreatingTask(true);

            const { data, error } = await supabase
              .from("tasks")
              .insert({
                title: newTaskTitle,
                due_date: newTaskDueDate,
                priority: newTaskPriority,
                project_id: selectedProjectId,
                user_id: user.id,
              })
              .select()
              .single();

            setCreatingTask(false);

            if (error) {
              alert(error.message);
              return;
            }

            settasks((prev) => [...prev, data]);
            setShowTaskModal(false);
            setNewTaskTitle("");
            setNewTaskDueDate("");
            setNewTaskPriority(2);
          }}
        >
          {creatingTask ? "Creating..." : "Create Task"}
        </button>
      </div>
    </div>
  </div>
)}

{/* ================= DEPENDENCY MODAL ================= */}
{showDependencyModal && (
  <div className="modal-overlay">
    <div className="modal">
      <h2>Declare Dependency</h2>

      <div className="dependency-row">
        <select
          value={toTaskId}
          onChange={(e) => setToTaskId(e.target.value)}
        >
          <option value="">Select task</option>
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.title}
            </option>
          ))}
        </select>

        <span className="dependency-text">depends on</span>

        <select
          value={fromTaskId}
          onChange={(e) => setFromTaskId(e.target.value)}
        >
          <option value="">Select task</option>
          {tasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.title}
            </option>
          ))}
        </select>
      </div>

      {fromTaskId === toTaskId && fromTaskId && (
        <p className="dependency-error">
          A task cannot depend on itself
        </p>
      )}

      <div className="modal-actions">
        <button
          className="cancel"
          onClick={() => {
            setShowDependencyModal(false);
            setFromTaskId("");
            setToTaskId("");
          }}
        >
          Cancel
        </button>

        <button
          className="create"
          disabled={
            !fromTaskId ||
            !toTaskId ||
            fromTaskId === toTaskId ||
            creatingDependency
          }
          onClick={async () => {
            setCreatingDependency(true);

            const { data, error } = await supabase
              .from("task_dependencies")
              .insert({
                user_id: user.id,
                project_id: selectedProjectId,
                from_task_id: fromTaskId,
                to_task_id: toTaskId,
              })
              .select()
              .single();

            setCreatingDependency(false);

            if (error) {
              alert(error.message);
              return;
            }

            setDependencies((prev) => [...prev, data]);
            setShowDependencyModal(false);
            setFromTaskId("");
            setToTaskId("");
          }}
        >
          {creatingDependency ? "Creating..." : "Create Dependency"}
        </button>
      </div>
    </div>
  </div>
)}

{/* ================= EDIT TASK MODAL ================= */}
{showEditModal && editingTask && (
  <div className="modal-overlay">
    <div className="modal">
      <h2>Edit Task</h2>

      <input
        type="text"
        placeholder="Task title"
        value={editTitle}
        onChange={(e) => setEditTitle(e.target.value)}
      />

      <input
        type="date"
        value={editDueDate}
        onChange={(e) => setEditDueDate(e.target.value)}
      />

      <select
        value={editPriority}
        onChange={(e) => setEditPriority(Number(e.target.value))}
      >
        <option value={1}>Priority 1 (High)</option>
        <option value={2}>Priority 2 (Medium)</option>
        <option value={3}>Priority 3 (Low)</option>
      </select>

      <div className="modal-actions">
        <button
          className="cancel"
          onClick={() => {
            setShowEditModal(false);
            setEditingTask(null);
          }}
        >
          Cancel
        </button>

        <button
          className="create"
          disabled={!editTitle || !editDueDate || updating}
          onClick={async () => {
            setUpdating(true);

            const { data, error } = await supabase
              .from("tasks")
              .update({
                title: editTitle,
                due_date: editDueDate,
                priority: editPriority,
              })
              .eq("id", editingTask.id)
              .select()
              .single();

            setUpdating(false);

            if (error) {
              alert(error.message);
              return;
            }

            settasks((prev) =>
              [...prev.map((t) => (t.id === data.id ? data : t))].sort(
                (a, b) => new Date(a.due_date) - new Date(b.due_date)
              )
            );

            setShowEditModal(false);
            setEditingTask(null);
          }}
        >
          {updating ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  </div>
)}


      
    </div>
  );
}
