"use client";
import ReactMarkdown from "react-markdown";
import { useRef } from "react";

import { useEffect, useState } from "react";

export default function Home() {
  const [tasks, setTasks] = useState<Array<{ id: string; title: string; description: string; status: string; priority: string; dueDate: string | null }>>([]);

  // Task form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  // suggestions
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [titleFocused, setTitleFocused] = useState(false);


  // Copilot
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [copilotInput, setCopilotInput] = useState("");
  const [messages, setMessages] = useState([]);
  const chatEndRef = useRef(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [taskProposal, setTaskProposal] = useState(null);


  const today = new Date().toISOString().split("T")[0];


  const fetchTasks = async () => {
    const res = await fetch("http://localhost:4000/tasks");
    setTasks(await res.json());
  };

  const updateTask = async (id, updates) => {
    await fetch(`http://localhost:4000/tasks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    });
    fetchTasks();
  };


  useEffect(() => {
    fetchTasks();
  }, []);

  // Debounced suggestions
  useEffect(() => {
    if (!title.trim()) {
      setAiSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoadingSuggestions(true);
        const res = await fetch("http://localhost:4000/ai/task-suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title })
        });
        const data = await res.json();
        setAiSuggestions(data.titleSuggestions || []);
      } catch {
        setAiSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 400); // debounce

    return () => clearTimeout(timer);
  }, [title]);


  const addTask = async () => {
    if (!title.trim()) return;

    await fetch("http://localhost:4000/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        status,
        priority,
        dueDate: dueDate || null
      })
    });

    setTitle("");
    setDescription("");
    setStatus("todo");
    setPriority("medium");
    setDueDate("");
    setAiSuggestions([]);
    fetchTasks();
  };

  const deleteTask = async (id) => {
    await fetch(`http://localhost:4000/tasks/${id}`, {
      method: "DELETE"
    });
    setConfirmDelete(null);
    fetchTasks();
  };


  const askCopilot = async () => {
    if (!copilotInput.trim()) return;

    const userMsg = { role: "user", content: copilotInput };
    setMessages(prev => [...prev, userMsg]);
    setCopilotInput("");
    setLoadingAI(true);

    const res = await fetch("http://localhost:4000/copilot/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMsg.content })
    });

    const data = await res.json();

    if (data.type === "task_proposal") {
      setTaskProposal(data.task);
    } else {
      const aiMsg = { role: "ai", content: data.response };
      setMessages(prev => [...prev, aiMsg]);
    }
    setLoadingAI(false);
  };

  const addSystemMessage = (text) => {
  setMessages(prev => [
    ...prev,
    { role: "ai", content: text }
  ]);
};


  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);


  return (
    <main className="min-h-screen bg-gray-50 p-8 relative">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">
          Task Workspace
        </h1>

        {/* Add Task */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="space-y-3">
            <div
              className="relative"
              onMouseDown={() => setTitleFocused(true)}
            >
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                onFocus={() => setTitleFocused(true)}
                onBlur={() => setTitleFocused(false)}
                placeholder="Task title"
                className="w-full border rounded-md px-3 py-2 text-sm text-black focus:ring-2 focus:ring-black"
              />

              {titleFocused && (loadingSuggestions || aiSuggestions.length > 0) && (
                <div className="absolute z-10 mt-1 w-full border rounded-md bg-gray-50 text-sm shadow">
                  {loadingSuggestions && (
                    <div className="px-3 py-2 text-gray-500">
                      Improving title…
                    </div>
                  )}

                  {aiSuggestions.map((s, i) => (
                    <div
                      key={i}
                      onMouseDown={async () => {
                        // mouseDown fires BEFORE blur — this is the key
                        setTitle(s);
                        setAiSuggestions([]);

                        try {
                          const res = await fetch("http://localhost:4000/ai/task-suggestions", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ title: s })
                          });
                          const data = await res.json();
                          setDescription(data.generatedDescription || "");
                        } catch { }
                      }}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-gray-700"
                    >
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>



            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Description (optional)"
              className="w-full border rounded-md px-3 py-2 text-sm text-black focus:ring-2 focus:ring-black"
              rows={2}
            />


            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm text-black"
              >
                <option value="todo">Todo</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>

              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm text-black"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>

              <input
                type="date"
                value={dueDate}
                min={today}
                onChange={e => setDueDate(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm text-black"
              />


              <button
                onClick={addTask}
                className="bg-black text-white rounded-md text-sm font-medium hover:bg-gray-800"
              >
                Add Task
              </button>
            </div>
          </div>
        </div>

        {/* Tasks */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tasks</h2>
          <ul className="divide-y">
            {tasks.map(t => (
              <li key={t.id} className="py-4 flex justify-between items-start gap-4">
                {/* Task info */}
                <div>
                  <p className="text-sm font-medium text-black">
                    {t.title}
                  </p>
                  {t.description && (
                    <p className="text-xs text-gray-600 mt-1">
                      {t.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {t.status} · {t.priority}
                    {t.dueDate && ` · due ${t.dueDate}`}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => updateTask(t.id, { status: "in-progress" })}
                    className="text-xs text-blue-600 px-2 py-1 border rounded hover:bg-gray-100"
                  >
                    In Progress
                  </button>

                  <button
                    onClick={() => setConfirmDelete(t)}
                    className="text-xs px-2 text-red-600 py-1 border rounded hover:bg-gray-100"
                  >
                    Done
                  </button>

                  {confirmDelete && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                      <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-6">
                        <h3 className="text-lg font-medium text-gray-900">
                          Delete this task?
                        </h3>

                        <p className="text-sm text-gray-600 mt-2">
                          You marked <span className="font-medium text-black">
                            “{confirmDelete.title}”
                          </span> as done.
                          Would you like to delete it now?
                        </p>

                        <div className="mt-5 flex justify-end gap-3">
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className="px-4 py-2 text-sm rounded-md bg-red-100 text-red-700 hover:bg-red-200"
                          >
                            No, keep it for later
                          </button>

                          <button
                            onClick={() => deleteTask(confirmDelete.id)}
                            className="px-4 py-2 text-sm rounded-md bg-green-600 text-white hover:bg-green-700"
                          >
                            Yes, delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}



                  <button
                    onClick={() => updateTask(t.id, { priority: "high" })}
                    className="text-xs text-green-600 px-2 py-1 border rounded hover:bg-gray-100"
                  >
                    High Priority
                  </button>
                </div>
              </li>
            ))}

            {tasks.length === 0 && (
              <p className="text-sm text-gray-500 py-6 text-center">
                No tasks yet.
              </p>
            )}
          </ul>
        </div>

      </div>

      {/* Copilot Floating Button */}
      <button
        onClick={() => setCopilotOpen(!copilotOpen)}
        className="fixed bottom-6 right-6 h-12 w-12 rounded-full bg-black text-white flex items-center justify-center shadow-lg"
      >
        ✦
      </button>

      {copilotOpen && (
        <div className="fixed bottom-20 right-6 w-96 bg-white rounded-lg shadow-lg flex flex-col max-h-[70vh]">

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`text-sm rounded-md px-3 py-2 max-w-[90%]
            ${msg.role === "user"
                    ? "bg-black text-white ml-auto"
                    : "bg-gray-100 text-black mr-auto"
                  }`}
              >
                <ReactMarkdown>
                  {msg.content}
                </ReactMarkdown>
              </div>
            ))}

            {loadingAI && (
              <div className="text-xs text-gray-500">Copilot is thinking…</div>
            )}

            <div ref={chatEndRef} />
          </div>
          {taskProposal && (
            <div className="mt-3 border rounded-md p-3 bg-gray-50 text-sm">
              <p className="font-medium text-gray-900 mb-2">
                Create this task?
              </p>

              <ul className="text-xs text-gray-700 space-y-1">
                <li><b>Title:</b> {taskProposal.title}</li>
                <li><b>Description:</b> {taskProposal.description}</li>
                <li><b>Status:</b> {taskProposal.status}</li>
                <li><b>Priority:</b> {taskProposal.priority}</li>
                <li><b>Due:</b> {taskProposal.dueDate ?? today}</li>
              </ul>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={async () => {
                    await fetch("http://localhost:4000/tasks", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(taskProposal)
                    });

                    addSystemMessage(
                      `Task **"${taskProposal.title}"** has been created.`
                    );

                    setTaskProposal(null);
                    fetchTasks();
                    setCopilotInput("");
                    addSystemMessage("Anything else I can help you with?");
                  }}
                  className="flex-1 bg-green-600 text-white rounded-md py-1"
                >

                  Create
                </button>

                <button
                  onClick={() => setTaskProposal(null)}
                  className="flex-1 bg-red-100 text-red-700 rounded-md py-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}


          {/* Input box (sticks to bottom) */}
          <div className="border-t p-3">
            <textarea
              value={copilotInput}
              onChange={e => setCopilotInput(e.target.value)}
              placeholder="Ask the copilot…"
              rows={2}
              className="w-full border rounded-md px-3 py-2 text-sm text-black focus:ring-2 focus:ring-black"
            />
            <button
              onClick={askCopilot}
              className="mt-2 w-full bg-black text-white rounded-md text-sm py-2 hover:bg-gray-800"
            >
              Ask
            </button>
          </div>
        </div>
      )}

    </main>
  );
}
