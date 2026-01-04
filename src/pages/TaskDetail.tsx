import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { taskService } from '../services/taskService';
import { type Task, TaskStatus } from '../types';

export const TaskDetail = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTask = async () => {
    if (!taskId) return;
    try {
      const response = await taskService.getTaskById(taskId);
      setTask(response);
    } catch (error) {
      console.error('Failed to fetch task:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchTask();
  }, [taskId]);

  const handleUpdateStatus = (status: TaskStatus) => {
    if (!taskId) return;
    void (async () => {
      try {
        await taskService.updateTask(taskId, { status });
        await fetchTask();
      } catch (error) {
        console.error('Failed to update task:', error);
      }
    })();
  };

  const handleDeleteTask = () => {
    if (!taskId) return;
    if (window.confirm('Are you sure you want to delete this task?')) {
      void (async () => {
        try {
          await taskService.deleteTask(taskId);
          await navigate('/tasks');
        } catch (error) {
          console.error('Failed to delete task:', error);
        }
      })();
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!task) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <h2>Task not found</h2>
        <Link to="/tasks">Back to Tasks</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link to="/tasks" style={{ textDecoration: 'none', color: '#007bff' }}>
          ← Back to Tasks
        </Link>
      </div>

      <div
        style={{
          padding: '30px',
          border: '1px solid #ccc',
          borderRadius: '5px',
          backgroundColor: '#f9f9f9',
        }}
      >
        <h1 style={{ marginTop: 0 }}>{task.title}</h1>

        <div style={{ marginBottom: '20px' }}>
          <h3>Description</h3>
          <p>{task.taskDescription || 'No description provided'}</p>
        </div>

        <div
          style={{
            marginBottom: '20px',
            fontSize: '0.9em',
            color: '#666',
          }}
        >
          <div style={{ marginBottom: '10px' }}>
            <strong>Status:</strong> {task.status}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Created:</strong>{' '}
            {new Date(task.createdAt).toLocaleDateString()}
          </div>
          {task.updatedAt && (
            <div>
              <strong>Last Updated:</strong>{' '}
              {new Date(task.updatedAt).toLocaleDateString()}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
          <div>
            <label
              htmlFor="status"
              style={{ display: 'block', marginBottom: '5px' }}
            >
              Update Status:
            </label>
            <select
              id="status"
              value={task.status}
              onChange={e => handleUpdateStatus(e.target.value as TaskStatus)}
              style={{ padding: '8px' }}
            >
              <option value={TaskStatus.OPEN}>Open</option>
              <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
              <option value={TaskStatus.CLOSED}>Closed</option>
            </select>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <button
              onClick={handleDeleteTask}
              style={{
                padding: '8px 16px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: 'pointer',
              }}
            >
              Delete Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
