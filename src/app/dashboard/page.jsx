"use client";
import { toast } from "sonner";

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
  const [showGraphModal, setShowGraphModal] = useState(false);
  const [showMoodleModal, setShowMoodleModal] = useState(false);
const [moodleToken, setMoodleToken] = useState("");
const [connectingMoodle, setConnectingMoodle] = useState(false);
const sortTasksByDueDate = (tasks) =>
  [...tasks].sort(
    (a, b) =>
      new Date(a.due_date ?? "9999-12-31") -
      new Date(b.due_date ?? "9999-12-31")
  );


useEffect(() => {
  document.body.style.overflow = showMoodleModal ? "hidden" : "auto";
}, [showMoodleModal]);
useEffect(() => {
  document.body.style.overflow = showModal ? "hidden" : "auto";
}, [showModal]);
useEffect(() => {
  document.body.style.overflow = showTaskModal ? "hidden" : "auto";
}, [showTaskModal]);
useEffect(() => {
  document.body.style.overflow = showDependencyModal ? "hidden" : "auto";
}, [showDependencyModal]);
useEffect(() => {
  document.body.style.overflow = showGraphModal ? "hidden" : "auto";
}, [showGraphModal]);
const selectedProject = projects.find(
  (p) => p.id === selectedProjectId
);



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
  const [showTaskInfoModal, setShowTaskInfoModal] = useState(false);
const [selectedTaskInfo, setSelectedTaskInfo] = useState(null);
const [hasMoodleConnection, setHasMoodleConnection] = useState(false);
const [replaceTokenMode, setReplaceTokenMode] = useState(false);
const [profile, setProfile] = useState(null);
const [username, setUsername] = useState(null);
useEffect(() => {
  if (!user?.id) return;

  const loadUsername = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();

    if (error) {
      console.error("Failed to load username", error);
      setUsername(null);
      return;
    }

    setUsername(data.username);
  };

  loadUsername();
}, [user]);


const STATUS_FLOW = ["todo","done"];
const getNextStatus = (current) => {
  const idx = STATUS_FLOW.indexOf(current);
  return STATUS_FLOW[(idx + 1) % STATUS_FLOW.length];
};
const buildDependencyGraphView = () => {
  const graph = {};
  const inDegree = {};
  const involvedTaskIds = new Set();

  // mark tasks that are involved in dependencies
  dependencies.forEach((d) => {
    involvedTaskIds.add(d.from_task_id);
    involvedTaskIds.add(d.to_task_id);
  });

  // init ONLY involved tasks
  tasks.forEach((t) => {
    if (involvedTaskIds.has(t.id)) {
      graph[t.id] = [];
      inDegree[t.id] = 0;
    }
  });

  // build graph
  dependencies.forEach((d) => {
    if (
      graph[d.from_task_id] &&
      graph[d.to_task_id]
    ) {
      graph[d.from_task_id].push(d.to_task_id);
      inDegree[d.to_task_id]++;
    }
  });

  // Kahn layers
  let queue = Object.keys(inDegree).filter(
    (id) => inDegree[id] === 0
  );

  const layers = [];

  while (queue.length) {
    const layer = [...queue];
    layers.push(layer);

    const nextQueue = [];

    layer.forEach((id) => {
      graph[id].forEach((n) => {
        inDegree[n]--;
        if (inDegree[n] === 0) {
          nextQueue.push(n);
        }
      });
    });

    queue = nextQueue;
  }

  return layers.map((layer) =>
    layer
      .map((id) => tasks.find((t) => t.id === id))
      .filter(Boolean)
  );
};

const hasUnfinishedDependencies = (taskId) => {
  // Tasks that THIS task depends on
  const deps = dependencies.filter(
    (d) => d.from_task_id === taskId
  );

  if (deps.length === 0) return false;

  return deps.some((dep) => {
    const prerequisiteTask = tasks.find(
      (t) => t.id === dep.to_task_id
    );
    return prerequisiteTask && prerequisiteTask.status !== "done";
  });
};
const buildGraph = (dependencies) => {
  const graph = {};

  dependencies.forEach((d) => {
    if (!graph[d.from_task_id]) {
      graph[d.from_task_id] = [];
    }
    graph[d.from_task_id].push(d.to_task_id);
  });

  return graph;
};
const hasPath = (graph, start, target, visited = new Set()) => {
  if (start === target) return true;

  if (visited.has(start)) return false;
  visited.add(start);

  const neighbors = graph[start] || [];
  for (const next of neighbors) {
    if (hasPath(graph, next, target, visited)) {
      return true;
    }
  }

  return false;
};
const createsCycle = (
  dependencies,
  fromTaskId,
  toTaskId
) => {
  const graph = buildGraph(dependencies);

  // check if toTask already leads back to fromTask
  return hasPath(graph, toTaskId, fromTaskId);
};
const handleRemoveDependency = async (dependencyId) => {
  // optimistic UI update (feels instant, WWE crowd pop)
  setDependencies((prev) =>
    prev.filter((d) => d.id !== dependencyId)
  );

  const { error } = await supabase
    .from("task_dependencies")
    .delete()
    .eq("id", dependencyId);

  if (error) {
    console.error(error);
    alert("Failed to remove dependency 😬");
  }
};
const handleDeleteProject = async (projectId) => {
  const confirmed = confirm(
  `⚠️ Delete project?\n\n` +
  `• All tasks will be removed\n` +
  `• All dependencies will be removed\n` +
  `• This cannot be undone\n`
);

  if (!confirmed) return;

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);

  if (error) {
    toast.error("Failed to delete project");
    return;
  }

  // 🔄 Update UI
  setProjects((prev) => prev.filter((p) => p.id !== projectId));

  if (selectedProjectId === projectId) {
    setSelectedProjectId(null);
    settasks([]);
    setDependencies([]);
  }

  toast.success("Project deleted");
};






  const [editTitle, setEditTitle] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editPriority, setEditPriority] = useState(2);
  const [updating, setUpdating] = useState(false);
 const checkMoodleConnection = async (uid) => {
  if (!uid) return;

  const { data, error } = await supabase
    .from("moodle_connections")
    .select("user_id")
    .eq("user_id", uid)
    .maybeSingle();

  if (error) {
    console.error("Moodle check failed", error);
    setHasMoodleConnection(false);
    return;
  }

  setHasMoodleConnection(!!data);
};





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
  // 🔹 EFFECT: check Moodle connection once user is known
useEffect(() => {
  if (!user) return;
  checkMoodleConnection(user.id);
}, [user]);




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

     settasks(sortTasksByDueDate(data));

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

 if (loading) {
  return (
    <div className="loading-screen">
      <div className="spinner" />
      <p>Waking up TaskFlow…</p>
    </div>
  );
}


  return (
    <div className="dashboard">
      <header className="topbar">
  <h1>TaskFlow</h1>

  <div className="topbar-actions">
    <button
      className="moodle-btn"
      onClick={() => {
  setReplaceTokenMode(false);
  setShowMoodleModal(true);
}}

    >
     {hasMoodleConnection ? "🔄 Sync Moodle" : "🔗 Connect Moodle"}
    </button>

    <button
      className="logout-btn"
      onClick={async () => {
        await supabase.auth.signOut();
        router.push("/login");
      }}
    >
      Logout
    </button>
  </div>
</header>


      <div className="content">
        <aside className="sidebar">
          <h3>Projects</h3>
         <ul>
  {projects.length === 0 ? (
    <li className="empty-state">
      <p>No projects yet</p>
      <span>Create your first one 🚀</span>
    </li>
  ) : (
    projects.map((project) => (
     <li
  key={project.id}
  onClick={() => setSelectedProjectId(project.id)}
  className={`
    ${project.id === selectedProjectId ? "active" : ""}
    ${project.source === "MOODLE" ? "moodle-project" : ""}
  `}
>
  <span className="project-name">
    {project.name}
   
  </span>

  <button
  className="project-delete-btn danger"
  onClick={(e) => {
    e.stopPropagation();
    handleDeleteProject(project.id);
  }}
>
  Delete
</button>

</li>


    ))
  )}
</ul>


          <button className="add-project" onClick={() => setShowModal(true)}>
            + New Project
          </button>
        </aside>

        <main
  className={`main ${
    selectedProject?.source === "MOODLE" ? "moodle-context" : ""
  }`}
>


  {/* 🟠 CASE 1: No projects at all */}
  {projects.length === 0 && (
    <div className="empty-main hero">
      <h2>
  Welcome back{username ? `, ${username}` : ""} 👋
</h2>
      <p>
        Your workspace is empty right now.<br />
        Create your first project to get started.
      </p>

      <button
        className="primary-btn"
        onClick={() => setShowModal(true)}
      >
        + Create your first project
      </button>
    </div>
  )}

  {/* 🟠 CASE 2: Projects exist but none selected */}
  {projects.length > 0 && !selectedProjectId && (
    <div className="empty-main">
      <h2>
  Welcome back{username ? `, ${username}` : ""} 👋
</h2>
      <p>
        Choose a project from the sidebar to view its tasks.
      </p>
    </div>
  )}

  {/* 🟠 CASE 3: Project selected but no tasks */}
  {selectedProjectId && tasks.length === 0 && (
    <div className="empty-main">
      <h2>
  Welcome back{username ? `, ${username}` : ""} 👋
</h2>
      <p>
        
        Add your first task to bring it to life ✨
      </p>

      <button
        className="primary-btn"
        onClick={() => setShowTaskModal(true)}
      >
        + Add first task
      </button>
    </div>
  )}

  {/* 🟢 CASE 4: Normal content */}
  {selectedProjectId && tasks.length > 0 && (
  <>
  <h2>
  Welcome back{username ? `, ${username}` : ""} 👋
</h2>



    <div className="task-actions">
      <button
        className="primary-btn"
        onClick={() => setShowTaskModal(true)}
      >
        + Add Task
      </button>

      <button
        className="secondary-btn"
        onClick={() => setShowDependencyModal(true)}
      >
        🔗 Declare Dependency
      </button>

      <button
        className="secondary-btn"
        onClick={() => setShowGraphModal(true)}
      >
        🧠 View Dependency Graph
      </button>
    </div>

    <div className="tasks-flow">
  {tasks.map((task, index) => (
    <div key={task.id} className="task-flow-item">
      <div
  className={`
    task-card
    priority-${task.priority}
    ${task.moodle_assignment_id ? "moodle-task" : ""}
  `}
>

        <div className="task-header">
          <h3>{task.title}</h3>

          <div className="badges">
            <span className={`priority-badge p${task.priority}`}>
              P{task.priority}
            </span>

            <button
              className={`status-badge ${task.status}`}
              onClick={async (e) => {
                e.stopPropagation();

                const nextStatus = getNextStatus(task.status);

                if (
                  nextStatus === "done" &&
                  hasUnfinishedDependencies(task.id)
                ) {
                  toast.error(
                    "This task depends on other tasks that are not done yet."
                  );
                  return;
                }

                const { data, error } = await supabase
                  .from("tasks")
                  .update({ status: nextStatus })
                  .eq("id", task.id)
                  .select()
                  .single();

                if (error) {
                  alert(error.message);
                  return;
                }

                settasks((prev) =>
  sortTasksByDueDate(
    prev.map((t) => (t.id === data.id ? data : t))
  )
);

              }}
            >
              {task.status.replace("_", " ")}
            </button>
          </div>
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

          <div className="task-actions-inline">
            <button
              className="edit-btn"
              onClick={(e) => {
                e.stopPropagation();
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
              onClick={async (e) => {
                e.stopPropagation();
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

  </>
)}


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

  const { error } = await supabase
    .from("tasks")
    .insert({
      title: newTaskTitle,
      due_date: newTaskDueDate,
      priority: newTaskPriority,
      status: "todo",
      project_id: selectedProjectId,
      user_id: user.id,
    });

  setCreatingTask(false);

  if (error) {
    alert(error.message);
    return;
  }

  const { data: refreshed } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", selectedProjectId)
    .eq("user_id", user.id)
    .order("due_date", { ascending: true });

  settasks(refreshed ?? []);

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
  <div
    className="modal-overlay"
    onClick={() => setShowDependencyModal(false)}
  >
    <div
      className="modal"
      onClick={(e) => e.stopPropagation()}
    >
      <h2>Declare Dependency</h2>

      <div className="dependency-row">
        <select
          value={toTaskId}
          onChange={(e) => setToTaskId(e.target.value)}
        >
          <option value="">Task 1</option>
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
          <option value="">Task 2</option>
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
          className="create"
          disabled={
            !fromTaskId ||
            !toTaskId ||
            fromTaskId === toTaskId ||
            creatingDependency
          }
          onClick={async () => {
            if (createsCycle(dependencies, fromTaskId, toTaskId)) {
              toast.error(
                "🚨 Invalid dependency: this creates a cycle."
              );
              return;
            }

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
              toast.error(error.message);
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
{/* ================= TASK INFO MODAL ================= */}
{showTaskInfoModal && selectedTaskInfo && (
  <div className="modal-overlay">
    <div className="modal wide">
      <h2>Task Details</h2>

      <h3 style={{ marginBottom: "8px" }}>
        {selectedTaskInfo.title}
      </h3>

      <p className="task-info-sub">
        📅 Due{" "}
        {selectedTaskInfo.due_date
          ? new Date(selectedTaskInfo.due_date).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : "No due date"}
      </p>
      
      {selectedTaskInfo.status === "done" ? (
  <div className="dependency-info">
    <p className="no-deps">
      ✅ This task is complete
    </p>
  </div>
) : (
  <div className="dependency-info">
  <h4>Dependencies</h4>

  {dependencies.filter(
    (d) => d.to_task_id === selectedTaskInfo.id
  ).length === 0 ? (
    <p className="no-deps">
      ✅ This task has no dependencies — you’re free to complete it.
    </p>
  ) : (
    <ul className="dependency-list">
      {dependencies
        .filter((d) => d.to_task_id === selectedTaskInfo.id)
        .map((dep) => {
          const dependsOn = tasks.find(
            (t) => t.id === dep.from_task_id
          );

          return (
            <li key={dep.id} className="dependency-item">
              <span className="dependency-text">
                ⛓ Depends on{" "}
                <strong>
                  {dependsOn?.title ?? "Unknown task"}
                </strong>
              </span>

              <button
                className="remove-btn"
                onClick={() =>
                  handleRemoveDependency(dep.id)
                }
              >
                ✖ Remove
              </button>
            </li>
          );
        })}
    </ul>
  )}
</div>

)}


      <div className="modal-actions">
        <button
          className="cancel"
          onClick={() => {
            setShowTaskInfoModal(false);
            setSelectedTaskInfo(null);
          }}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}
{showGraphModal && (
  <div className="modal-overlay">
    <div className="modal wide">
      <h2>Project Dependency Graph</h2>

      {dependencies.length === 0 ? (
        <p className="no-deps">
          ✅ No dependencies in this project.
        </p>
      ) : (
        <div className="graph-view">
          {buildDependencyGraphView().map(
            (layer, index) => (
              <div key={index} className="graph-layer">
                <h4>
                  Level {index}
                  {index === 0 && " (Independent)"}
                </h4>

                <ul>
                  {layer.map(
                    (task) =>
                      task && (
                        <li key={task.id}>
                          {task.title}
                        </li>
                      )
                  )}
                </ul>

                {index <
                  buildDependencyGraphView().length -
                    1 && (
                  <div className="graph-arrow">
                    ↓
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}

      <div className="modal-actions">
        <button
          className="cancel"
          onClick={() => setShowGraphModal(false)}
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}
{showMoodleModal && (
  <div className="moodle-modal-overlay">
    <div className="moodle-modal">

      <h2>Moodle Connection</h2>

      {/* CASE 1: Already connected & NOT replacing token */}
      {hasMoodleConnection && !replaceTokenMode && (
        <>
          <p className="hint">
            Your Moodle account is already connected.
          </p>

          <div className="moodle-actions-vertical">
            <button
              className="primary"
              onClick={async () => {
                try {
                  setConnectingMoodle(true);

                  
                    const { error } = await supabase.functions.invoke("sync-moodle");

if (error) throw error;


                  
                  // 🔄 Refresh projects after sync
const { data: projectsData } = await supabase
  .from("projects")
  .select("*")
  .eq("user_id", user.id);

setProjects(projectsData ?? []);


                 toast.success("Moodle connected & synced!");
                  setShowMoodleModal(false);
                } catch (err) {
                  toast.error("Failed to sync Moodle");
                } finally {
                  setConnectingMoodle(false);
                }
              }}
            >
              {connectingMoodle ? "Syncing…" : "🔄 Sync Now"}
            </button>

            <button
              className="secondary"
              onClick={() => setReplaceTokenMode(true)}
            >
              🔁 Replace Token
            </button>

            <button
              className="cancel"
              onClick={() => setShowMoodleModal(false)}
            >
              Cancel
            </button>
          </div>
        </>
      )}

      {/* CASE 2: Not connected OR replacing token */}
      {(!hasMoodleConnection || replaceTokenMode) && (
        <>
          <p className="hint">
            Paste your Moodle access token.
            <br />
            It will be used only to sync your courses and assignments.
          </p>

          <input
            type="password"
            placeholder="Moodle access token"
            value={moodleToken}
            onChange={(e) => setMoodleToken(e.target.value)}
          />

         <p className="trust">
  🔐 Your token is encrypted, stored securely, and never shared.
</p>

<a
  href="/security"
  target="_blank"
  rel="noopener noreferrer"
  style={{
    fontSize: "13px",
    color: "#000000",
    textDecoration: "underline",
    marginTop: "6px",
    display: "inline-block",
  }}
>
  How to get your token & how we keep it secure →
</a>

          

          <div className="moodle-modal-actions">
            <button
              className="cancel"
              onClick={() => {
                setShowMoodleModal(false);
                setReplaceTokenMode(false);
                setMoodleToken("");
              }}
            >
              Cancel
            </button>

            <button
              className="primary"
              disabled={!moodleToken || connectingMoodle}
              onClick={async () => {
                try {
                  setConnectingMoodle(true);
                  

                 const { error: connectError } =
  await supabase.functions.invoke(
    "connect-moodle",
    {
      body: { token: moodleToken },
    }
  );

if (connectError) throw connectError;
setHasMoodleConnection(true);

                  

                 const { error: syncError } =
  await supabase.functions.invoke("sync-moodle");

if (syncError) throw syncError;


                 
                  // 🔄 Refresh projects after sync
const { data: projectsData, error: projectsError } = await supabase
  .from("projects")
  .select("*")
  .eq("user_id", user.id);

if (!projectsError) {
  setProjects(projectsData ?? []);
}


                  setHasMoodleConnection(true);

                  toast.success("✅ Moodle connected & synced!");
                  setShowMoodleModal(false);
                  setReplaceTokenMode(false);
                  setMoodleToken("");

                } catch (err) {
                  toast.error(err.message ?? "Failed to connect Moodle");
                } finally {
                  setConnectingMoodle(false);
                }
              }}
            >
              {connectingMoodle ? "Working…" : "Connect & Sync"}
            </button>
          </div>
        </>
      )}

    </div>
  </div>
)}






      
    </div>
  );
}
