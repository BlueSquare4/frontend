# Task Workspace Frontend

A Next.js-based task management interface with AI-powered Copilot assistance.

## Getting Started

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Features

- **Task Management**: Create, update, delete, and organize tasks with status, priority, and due dates
- **AI Title Suggestions**: Get AI-powered suggestions to improve task titles as you type
- **Copilot Chat**: Ask the AI copilot to help with tasks using natural language
- **Task Proposals**: Accept or reject AI-suggested task creations
- **Update Proposals**: Review and apply AI-suggested task updates
- **Delete Proposals**: Confirm task deletions with AI assistance
- **Subtask Breakdown**: AI breaks down complex tasks into actionable subtasks
  - Scrollable subtask panel for better UI when many subtasks are suggested
  - Close button to dismiss the suggested subtasks panel

## Development

Edit `app/page.tsx` to modify the main page. Changes auto-update in the browser.
