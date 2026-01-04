import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { taskService } from '../services/taskService';
import { CreateTaskRequest, Task, TaskStatus } from '../types';

export const Tasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTask, setNewTask] = useState<CreateTaskRequest>({
    title: '',
    taskDescription: '',
  });
  const { logout } = useAuth();

  const fetchTasks = async () => {
    try {
      const response = await taskService.getAllTasks();
      setTasks(response.content);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTasks();
  }, []);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    void (async () => {
      try {
        await taskService.createTask(newTask);
        setNewTask({ title: '', taskDescription: '' });
        setShowCreateForm(false);
        await fetchTasks();
      } catch (error) {
        console.error('Failed to create task:', error);
      }
    })();
  };

  const handleUpdateStatus = (taskId: string, status: TaskStatus) => {
    void (async () => {
      try {
        await taskService.updateTask(taskId, { status });
        await fetchTasks();
      } catch (error) {
        console.error('Failed to update task:', error);
      }
    })();
  };

  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      void (async () => {
        try {
          await taskService.deleteTask(taskId);
          await fetchTasks();
        } catch (error) {
          console.error('Failed to delete task:', error);
        }
      })();
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <h1>Tasks</h1>
        <div>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{ marginRight: '10px', padding: '10px 20px' }}
          >
            {showCreateForm ? 'Cancel' : 'New Task'}
          </button>
          <button onClick={logout} style={{ padding: '10px 20px' }}>
            Logout
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div
          style={{
            marginBottom: '20px',
            padding: '20px',
            border: '1px solid #ccc',
            borderRadius: '5px',
          }}
        >
          <h3>Create New Task</h3>
          <form onSubmit={handleCreateTask}>
            <div style={{ marginBottom: '15px' }}>
              <label
                htmlFor="title"
                style={{ display: 'block', marginBottom: '5px' }}
              >
                Title
              </label>
              <input
                id="title"
                type="text"
                value={newTask.title}
                onChange={e =>
                  setNewTask({ ...newTask, title: e.target.value })
                }
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label
                htmlFor="description"
                style={{ display: 'block', marginBottom: '5px' }}
              >
                Description
              </label>
              <textarea
                id="description"
                value={newTask.taskDescription}
                onChange={e =>
                  setNewTask({ ...newTask, taskDescription: e.target.value })
                }
                style={{
                  width: '100%',
                  padding: '8px',
                  boxSizing: 'border-box',
                  minHeight: '100px',
                }}
              />
            </div>
            <button type="submit" style={{ padding: '10px 20px' }}>
              Create Task
            </button>
          </form>
        </div>
      )}

      <div>
        {tasks.length === 0 ? (
          <p>No tasks found. Create your first task!</p>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {tasks.map(task => (
              <div
                key={task.taskId}
                style={{
                  padding: '20px',
                  border: '1px solid #ccc',
                  borderRadius: '5px',
                  backgroundColor: '#f9f9f9',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <h3 style={{ marginTop: 0 }}>{task.title}</h3>
                    {task.taskDescription && <p>{task.taskDescription}</p>}
                    <div
                      style={{
                        fontSize: '0.9em',
                        color: '#666',
                        marginTop: '10px',
                      }}
                    >
                      <div>
                        Status: <strong>{task.status}</strong>
                      </div>
                      <div>
                        Created: {new Date(task.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: '10px',
                      flexDirection: 'column',
                    }}
                  >
                    <select
                      value={task.status}
                      onChange={e =>
                        handleUpdateStatus(
                          task.taskId,
                          e.target.value as TaskStatus
                        )
                      }
                      style={{ padding: '5px' }}
                    >
                      <option value={TaskStatus.OPEN}>Open</option>
                      <option value={TaskStatus.IN_PROGRESS}>
                        In Progress
                      </option>
                      <option value={TaskStatus.CLOSED}>Closed</option>
                    </select>
                    <button
                      onClick={() => handleDeleteTask(task.taskId)}
                      style={{
                        padding: '5px 10px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
