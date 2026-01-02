"use client";
import { useEffect, useState } from "react";

export default function Home() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [copilotInput, setCopilotInput] = useState("");
  const [copilotResponse, setCopilotResponse] = useState("");

  useEffect(() => {
    fetch("http://localhost:4000/tasks")
      .then(res => res.json())
      .then(setTasks);
  }, []);

  const addTask = async () => {
    await fetch("http://localhost:4000/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title })
    });
    setTitle("");
    const updated = await fetch("http://localhost:4000/tasks").then(res => res.json());
    setTasks(updated);
  };

  const askCopilot = async () => {
    const res = await fetch("http://localhost:4000/copilot/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: copilotInput })
    });
    const data = await res.json();
    setCopilotResponse(data.response);
  };

  return (
    <main style={{ padding: 24 }}>
      <h1>Task Workspace</h1>

      <section>
        <h3>Add Task</h3>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Task title"
        />
        <button onClick={addTask}>Add</button>
      </section>

      <section>
        <h3>Tasks</h3>
        <ul>
          {tasks.map(t => (
            <li key={t.id}>
              {t.title} — {t.status} ({t.priority})
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3>Copilot</h3>
        <input
          value={copilotInput}
          onChange={e => setCopilotInput(e.target.value)}
          placeholder="Ask the copilot..."
        />
        <button onClick={askCopilot}>Ask</button>
        <p>{copilotResponse}</p>
      </section>
    </main>
  );
}
