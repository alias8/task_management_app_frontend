import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
} from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { FeatureFlagProvider } from './contexts/FeatureFlagContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicRoute } from './components/PublicRoute';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Tasks } from './pages/Tasks';
import { TaskDetail } from './pages/TaskDetail';

function App() {
  return (
    <Router>
      <FeatureFlagProvider>
      <AuthProvider>
        <div>
          <div
            style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}
          >
            <h1
              style={{
                textAlign: 'center',
                margin: '50px 0 50px',
              }}
            >
              Task Management App example
            </h1>
          </div>
          <div
            style={{
              height: '500px',
              maxWidth: '1200px',
              margin: '0 auto',
              padding: '0 20px',
            }}
          >
            <Routes>
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="/signup"
                element={
                  <PublicRoute>
                    <Signup />
                  </PublicRoute>
                }
              />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Routes>
                      <Route path="/tasks" element={<Tasks />} />
                      <Route path="/tasks/:taskId" element={<TaskDetail />} />
                      <Route
                        path="/"
                        element={<Navigate to="/tasks" replace />}
                      />
                    </Routes>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </div>
        </div>
      </AuthProvider>
      </FeatureFlagProvider>
    </Router>
  );
}

export default App;
