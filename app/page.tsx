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
  const [updateProposal, setUpdateProposal] = useState(null);
  const [deleteProposal, setDeleteProposal] = useState(null);
  const [subtaskProposal, setSubtaskProposal] = useState(null);
  const [darkMode, setDarkMode] = useState(false);


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
    }
    else if (data.type === "update_proposal") {
      setUpdateProposal({
        taskId: data.taskId,
        updates: data.updates
      });

      setMessages(prev => [
        ...prev,
        {
          role: "ai",
          content: "I found the task you mentioned and prepared an update. Please confirm below."
        }
      ]);
    }
    else if (data.type === "delete_proposal") {
      setDeleteProposal({
        taskId: data.taskId
      });

      setMessages(prev => [
        ...prev,
        {
          role: "ai",
          content: "I found the task you want to delete. Please confirm."
        }
      ]);
    }
    else if (data.type === "subtask_proposal") {
      setSubtaskProposal({
        taskId: data.taskId,
        subtasks: data.subtasks
      });

      setMessages(prev => [
        ...prev,
        {
          role: "ai",
          content: "I broke the task into smaller actionable steps. Review them below."
        }
      ]);
    }
    else {
      setMessages(prev => [
        ...prev,
        { role: "ai", content: data.response }
      ]);
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
    <main className={`min-h-screen p-8 relative transition-colors ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Task Workspace
          </h1>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              darkMode
                ? 'bg-gray-700 text-yellow-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
            }`}
          >
            {darkMode ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>

        {/* Add Task */}
        <div className={`rounded-lg shadow-sm p-6 mb-6 transition-colors ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
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
                className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black transition-colors ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-black placeholder-gray-500'
                }`}
              />

              {titleFocused && (loadingSuggestions || aiSuggestions.length > 0) && (
                <div className={`absolute z-10 mt-1 w-full border rounded-md text-sm shadow transition-colors ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600'
                    : 'bg-gray-50 border-gray-300'
                }`}>
                  {loadingSuggestions && (
                    <div className={`px-3 py-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
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
                      className={`px-3 py-2 cursor-pointer transition-colors ${
                        darkMode
                          ? 'hover:bg-gray-600 text-gray-200'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
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
              className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black transition-colors ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-black placeholder-gray-500'
              }`}
              rows={2}
            />


            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className={`border rounded-md px-3 py-2 text-sm transition-colors ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-black'
                }`}
              >
                <option value="todo">Todo</option>
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>

              <select
                value={priority}
                onChange={e => setPriority(e.target.value)}
                className={`border rounded-md px-3 py-2 text-sm transition-colors ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-black'
                }`}
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
                className={`border rounded-md px-3 py-2 text-sm transition-colors ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-black'
                }`}
              />


              <button
                onClick={addTask}
                className={`rounded-md text-sm font-medium transition-colors ${
                  darkMode
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-black text-white hover:bg-gray-800'
                }`}
              >
                Add Task
              </button>
            </div>
          </div>
        </div>

        {/* Tasks */}
        <div className={`rounded-lg shadow-sm p-6 transition-colors ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Tasks</h2>
          <ul className={`divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
            {tasks.map(t => (
              <li key={t.id} className="py-4 flex justify-between items-start gap-4">
                {/* Task info */}
                <div>
                  <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
                    {t.title}
                  </p>
                  {t.description && (
                    <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {t.description}
                    </p>
                  )}
                  <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {t.status} · {t.priority}
                    {t.dueDate && ` · due ${t.dueDate}`}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => updateTask(t.id, { status: "in-progress" })}
                    className={`text-xs px-2 py-1 border rounded transition-colors ${
                      darkMode
                        ? 'text-blue-400 border-blue-500 hover:bg-gray-700'
                        : 'text-blue-600 border-blue-600 hover:bg-gray-100'
                    }`}
                  >
                    In Progress
                  </button>

                  <button
                    onClick={() => setConfirmDelete(t)}
                    className={`text-xs px-2 py-1 border rounded transition-colors ${
                      darkMode
                        ? 'text-red-400 border-red-500 hover:bg-gray-700'
                        : 'text-red-600 border-red-600 hover:bg-gray-100'
                    }`}
                  >
                    Done
                  </button>

                  {confirmDelete && (
                    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                      <div className={`rounded-lg shadow-lg w-full max-w-sm p-6 transition-colors ${
                        darkMode ? 'bg-gray-800' : 'bg-white'
                      }`}>
                        <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                          Delete this task?
                        </h3>

                        <p className={`text-sm mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          You marked <span className={`font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
                            “{confirmDelete.title}”
                          </span> as done.
                          Would you like to delete it now?
                        </p>

                        <div className="mt-5 flex justify-end gap-3">
                          <button
                            onClick={() => setConfirmDelete(null)}
                            className={`px-4 py-2 text-sm rounded-md transition-colors ${
                              darkMode
                                ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                                : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                          >
                            No, keep it for later
                          </button>

                          <button
                            onClick={() => deleteTask(confirmDelete.id)}
                            className={`px-4 py-2 text-sm rounded-md transition-colors ${
                              darkMode
                                ? 'bg-green-700 text-white hover:bg-green-600'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                          >
                            Yes, delete
                          </button>
                        </div>
                      </div>
                    </div>
                  )}



                  <button
                    onClick={() => updateTask(t.id, { priority: "high" })}
                    className={`text-xs px-2 py-1 border rounded transition-colors ${
                      darkMode
                        ? 'text-green-400 border-green-500 hover:bg-gray-700'
                        : 'text-green-600 border-green-600 hover:bg-gray-100'
                    }`}
                  >
                    High Priority
                  </button>
                </div>
              </li>
            ))}

            {tasks.length === 0 && (
              <p className={`text-sm py-6 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No tasks yet.
              </p>
            )}
          </ul>
        </div>

      </div>

      {/* Copilot Floating Button */}
      <button
        onClick={() => setCopilotOpen(!copilotOpen)}
        className={`fixed bottom-6 right-6 h-12 w-12 rounded-full text-white flex items-center justify-center shadow-lg transition-colors ${
          darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-black hover:bg-gray-900'
        }`}
      >
        ✦
      </button>

      {copilotOpen && (
        <div className={`fixed bottom-20 right-6 w-96 rounded-lg shadow-lg flex flex-col max-h-[70vh] transition-colors ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}>

          {/* Chat messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`text-sm rounded-md px-3 py-2 max-w-[90%] transition-colors
            ${msg.role === "user"
                    ? darkMode
                      ? "bg-blue-600 text-white ml-auto"
                      : "bg-black text-white ml-auto"
                    : darkMode
                    ? "bg-gray-700 text-gray-100 mr-auto"
                    : "bg-gray-100 text-black mr-auto"
                  }`}
              >
                <ReactMarkdown>
                  {msg.content}
                </ReactMarkdown>
              </div>
            ))}

            {loadingAI && (
              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Copilot is thinking…</div>
            )}

            <div ref={chatEndRef} />
          </div>
          {taskProposal && (
            <div className={`mt-3 border rounded-md p-3 text-sm transition-colors ${
              darkMode
                ? 'bg-gray-700 border-gray-600'
                : 'bg-gray-50 border-gray-300'
            }`}>
              <p className={`font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Create this task?
              </p>

              <ul className={`text-xs space-y-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
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
                  className={`flex-1 text-white rounded-md py-1 transition-colors ${
                    darkMode
                      ? 'bg-green-700 hover:bg-green-600'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >

                  Create
                </button>

                <button
                  onClick={() => setTaskProposal(null)}
                  className={`flex-1 rounded-md py-1 transition-colors ${
                    darkMode
                      ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {updateProposal && (
            <div className={`mt-3 border rounded-md p-3 text-sm transition-colors ${
              darkMode
                ? 'bg-gray-700 border-gray-600'
                : 'bg-gray-50 border-gray-300'
            }`}>
              <p className={`font-medium mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Update this task?
              </p>

              <ul className={`text-xs space-y-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {Object.entries(updateProposal.updates).map(([k, v]) => (
                  <li key={k}>
                    <b>{k}:</b> {String(v)}
                  </li>
                ))}
              </ul>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={async () => {
                    await fetch(
                      `http://localhost:4000/tasks/${updateProposal.taskId}`,
                      {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(updateProposal.updates)
                      }
                    );

                    setMessages(prev => [
                      ...prev,
                      {
                        role: "ai",
                        content: "Task updated successfully."
                      }
                    ]);

                    setUpdateProposal(null);
                    fetchTasks();
                  }}
                  className={`flex-1 text-white rounded-md py-1 transition-colors ${
                    darkMode
                      ? 'bg-green-700 hover:bg-green-600'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  Apply update
                </button>

                <button
                  onClick={() => setUpdateProposal(null)}
                  className={`flex-1 rounded-md py-1 transition-colors ${
                    darkMode
                      ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}


          {deleteProposal && (
            <div className={`mt-3 border rounded-md p-3 text-sm transition-colors ${
              darkMode
                ? 'bg-red-900/20 border-red-800'
                : 'bg-red-50 border-red-200'
            }`}>
              <p className={`font-medium mb-2 ${darkMode ? 'text-red-400' : 'text-red-700'}`}>
                Delete this task?
              </p>

              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-700'}`}>
                This action cannot be undone.
              </p>

              <div className="flex gap-2 mt-3">
                <button
                  onClick={async () => {
                    await fetch(
                      `http://localhost:4000/tasks/${deleteProposal.taskId}`,
                      { method: "DELETE" }
                    );

                    setMessages(prev => [
                      ...prev,
                      {
                        role: "ai",
                        content: "Task deleted."
                      }
                    ]);

                    setDeleteProposal(null);
                    fetchTasks();
                  }}
                  className={`flex-1 text-white rounded-md py-1 transition-colors ${
                    darkMode
                      ? 'bg-red-700 hover:bg-red-600'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Yes, delete
                </button>

                <button
                  onClick={() => setDeleteProposal(null)}
                  className={`flex-1 rounded-md py-1 transition-colors ${
                    darkMode
                      ? 'bg-gray-700 text-gray-200 hover:bg-gray-600'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  Keep it
                </button>
              </div>
            </div>
          )}

          {subtaskProposal && (
            <div className={`mt-3 border rounded-md p-3 text-sm max-h-48 overflow-y-auto flex flex-col transition-colors ${
              darkMode
                ? 'bg-gray-700 border-gray-600'
                : 'bg-gray-50 border-gray-300'
            }`}>
              <div className={`flex items-center justify-between mb-2 sticky top-0 ${
                darkMode ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-black'}`}>
                  Suggested subtasks
                </p>
                <button
                  onClick={() => setSubtaskProposal(null)}
                  className={`text-lg transition-colors ${
                    darkMode
                      ? 'text-gray-400 hover:text-gray-300'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {subtaskProposal.subtasks.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between py-1"
                  >
                    <div>
                      <p className={`font-medium ${darkMode ? 'text-white' : 'text-black'}`}>{s.title}</p>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{s.description}</p>
                    </div>

                    <button
                      onClick={async () => {
                        await fetch("http://localhost:4000/tasks", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            title: s.title,
                            description: s.description,
                            status: "todo",
                            priority: "medium",
                            dueDate: null
                          })
                        });
                        fetchTasks();
                      }}
                      className={`text-xs text-white px-2 py-1 rounded flex-shrink-0 transition-colors ${
                        darkMode
                          ? 'bg-green-700 hover:bg-green-600'
                          : 'bg-green-600 hover:bg-green-700'
                      }`}
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}





          {/* Input box (sticks to bottom) */}
          <div className={`border-t p-3 transition-colors ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <textarea
              value={copilotInput}
              onChange={e => setCopilotInput(e.target.value)}
              placeholder="Ask the copilot…"
              rows={2}
              className={`w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-black transition-colors ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-black placeholder-gray-500'
              }`}
            />
            <button
              onClick={askCopilot}
              className={`mt-2 w-full text-white rounded-md text-sm py-2 transition-colors ${
                darkMode
                  ? 'bg-gray-700 hover:bg-gray-600'
                  : 'bg-black hover:bg-gray-800'
              }`}
            >
              Ask
            </button>
          </div>
        </div>
      )}

    </main>
  );
}
