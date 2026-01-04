# Task Management Frontend

A React TypeScript frontend application for the Task Management backend.

## Features

- User authentication (login/signup)
- Task management (create, read, update, delete)
- Task status tracking (Open, In Progress, Closed)
- Organization-based access control
- JWT token-based authentication

## Tech Stack

- React 18
- TypeScript
- Vite
- React Router DOM
- Axios
- Context API for state management

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Backend API running on `http://localhost:8080`

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory (or copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update the `.env` file with your backend API URL if different from default:
```
VITE_API_BASE_URL=http://localhost:8080
```

## Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Build

Build for production:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Project Structure

```
src/
├── components/        # Reusable components
│   └── ProtectedRoute.tsx
├── contexts/          # React contexts
│   └── AuthContext.tsx
├── pages/             # Page components
│   ├── Login.tsx
│   ├── Signup.tsx
│   └── Tasks.tsx
├── services/          # API services
│   ├── api.ts
│   ├── taskService.ts
│   └── userService.ts
├── types/             # TypeScript type definitions
│   └── index.ts
├── App.tsx            # Main application component
└── main.tsx           # Application entry point
```

## Usage

1. Make sure the backend is running on `http://localhost:8080`
2. Start the frontend development server
3. Navigate to `http://localhost:5173`
4. Sign up with a new account (you'll need an organization ID)
5. Log in with your credentials
6. Start managing tasks!

## API Integration

The frontend communicates with the backend through the following endpoints:

- `POST /api/users` - Create new user
- `POST /api/users/login` - User login
- `GET /api/users/me` - Get current user
- `GET /api/tasks` - Get all tasks (paginated)
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

All authenticated requests include a JWT token in the Authorization header.
