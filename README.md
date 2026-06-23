# Task Management Frontend

A React TypeScript frontend application for the Task Management backend.
This is an example/demo project showcasing modern React frontend development practices.

# Live Demo

- Live Site: https://taskmanager-jkirk-547563.com/login
- Backend Repository: https://github.com/alias8/java-spring-backend

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
- Feature flag service running on `http://localhost:8081` (optional — all flags default to `false` if unavailable)

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
VITE_FEATURE_FLAG_URL=http://localhost:8081
VITE_FEATURE_FLAG_API_KEY=test-token-1
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

## Feature Flags

Feature flags are served by a standalone Kotlin service ([feature-flag-service-kotlin](https://github.com/alias8/feature-flag-service-kotlin)) over a persistent Server-Sent Events connection. The frontend connects on startup and receives live updates whenever a flag changes — no polling required.

### Running the flag service locally

The flag service defaults to port 8080, which conflicts with the task management API. Map it to 8081 in the service's `docker-compose.yml`:

```yaml
ports:
  - "8081:8080"
```

Then start it:

```bash
docker compose up
```

The service seeds two API keys on startup: `test-token-1` and `test-token-2`.

### CORS

The flag service must allow requests from the frontend origin. Add a CORS configuration bean in the Kotlin service (Spring Boot):

```kotlin
@Bean
fun corsConfigurationSource(): CorsConfigurationSource {
    val config = CorsConfiguration()
    config.allowedOrigins = listOf("http://localhost:5173")
    config.allowedMethods = listOf("GET")
    config.allowedHeaders = listOf("Authorization")
    val source = UrlBasedCorsConfigurationSource()
    source.registerCorsConfiguration("/**", config)
    return source
}
```

### Using a flag in a component

```tsx
import { useFeatureFlags } from '../contexts/FeatureFlagContext';

export const MyComponent = () => {
  const { getFeatureFlag } = useFeatureFlags();
  // ...
  const showBanner = getFeatureFlag("showTaskExtraBanner123");
  // ...
};
```

`getFeatureFlag` returns `false` for any flag that doesn't exist or hasn't loaded yet. The context is provided at the app root, so it is available in any component without additional setup.

### Creating or updating a flag

```bash
curl -X PATCH http://localhost:8081/flags \
  -H "Authorization: Bearer test-token-1" \
  -H "Content-Type: application/json" \
  -d '{"name": "showTaskExtraBanner123", "enabled": true}'
```

Connected clients receive the update instantly over SSE.

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
