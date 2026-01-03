# Task Workspace Frontend

A Next.js-based task management interface with AI-powered Copilot assistance.

## Quick Start

### Prerequisites
- Node.js (v16+)
- npm or yarn

### Setup Instructions

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   - Navigate to [http://localhost:3000](http://localhost:3000)

> **Note**: Make sure the backend server is running on `http://localhost:4000` before starting the frontend.

---

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
- **Dark Mode Toggle**: Switch between light and dark themes seamlessly

## Development

Edit `app/page.tsx` to modify the main page. Changes auto-update in the browser.
