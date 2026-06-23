import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useFeatureFlags } from '../contexts/FeatureFlagContext';
import { taskService } from '../services/taskService';
import { commentService } from '../services/commentService';
import { type Comment, type Task, TaskStatus } from '../types';

export const TaskDetail = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();
  const { isAdmin, userId } = useAuth();
  const { getFeatureFlag } = useFeatureFlags();
  const [task, setTask] = useState<Task | null>(null);
  const [taskLoading, setTaskLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const isFetchingTask = useRef(false);
  const isFetchingComments = useRef(false);

  const fetchTask = async () => {
    if (!taskId || isFetchingTask.current) return;
    isFetchingTask.current = true;
    setTaskLoading(true);
    setError(null);
    try {
      const response = await taskService.getTaskById(taskId);
      setTask(response);
    } catch (error) {
      console.error('Failed to fetch task:', error);
      setError('Failed to load task. Please try again.');
    } finally {
      setTaskLoading(false);
      isFetchingTask.current = false;
    }
  };

  const fetchComments = async () => {
    if (!taskId || isFetchingComments.current) return;
    isFetchingComments.current = true;
    setCommentsLoading(true);
    try {
      const response = await commentService.listComments(taskId);
      setComments(response.content);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setCommentsLoading(false);
      isFetchingComments.current = false;
    }
  };

  useEffect(() => {
    void fetchTask();
    void fetchComments();
  }, []);

  const handleUpdateStatus = (status: keyof typeof TaskStatus) => {
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

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskId || !newComment.trim()) return;

    setIsSubmittingComment(true);
    try {
      await commentService.addComment(taskId, { body: newComment });
      setNewComment('');
      await fetchComments();
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!taskId) return;
    if (window.confirm('Are you sure you want to delete this comment?')) {
      try {
        await commentService.deleteComment(taskId, commentId);
        await fetchComments();
      } catch (error) {
        console.error('Failed to delete comment:', error);
      }
    }
  };

  if (taskLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <h2>Error</h2>
        <p style={{ color: '#dc3545' }}>{error}</p>
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button
            onClick={() => void fetchTask()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
          <Link to="/tasks">Back to Tasks</Link>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <h2>Task not found</h2>
        <Link to="/tasks">Back to Tasks</Link>
      </div>
    );
  }
  
  const FF1 = getFeatureFlag("showTaskExtraBannerFlag", userId)

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
        {FF1 && <div>Feature flag on</div>}

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
              onChange={e => handleUpdateStatus(e.target.value as keyof typeof TaskStatus)}
              style={{ padding: '8px' }}
              disabled={!isAdmin}
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
                backgroundColor: isAdmin ? '#dc3545' : 'lightgray',
                color: 'white',
                border: 'none',
                borderRadius: '3px',
                cursor: isAdmin ? 'pointer' : 'not-allowed',
                opacity: isAdmin ? 1 : 0.6,
              }}
              disabled={!isAdmin}
            >
              Delete Task
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: '30px',
          padding: '30px',
          border: '1px solid #ccc',
          borderRadius: '5px',
          backgroundColor: '#f9f9f9',
        }}
      >
        <h2 style={{ marginTop: 0 }}>Comments</h2>

        <form
          onSubmit={e => void handleAddComment(e)}
          style={{ marginBottom: '20px' }}
        >
          <textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '3px',
              border: '1px solid #ccc',
              fontSize: '0.95em',
              fontFamily: 'inherit',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
          <button
            type="submit"
            disabled={!newComment.trim() || isSubmittingComment}
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              backgroundColor:
                !newComment.trim() || isSubmittingComment ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor:
                !newComment.trim() || isSubmittingComment
                  ? 'not-allowed'
                  : 'pointer',
            }}
          >
            {isSubmittingComment ? 'Adding...' : 'Add Comment'}
          </button>
        </form>

        {commentsLoading ? (
          <p>Loading comments...</p>
        ) : comments.length === 0 ? (
          <p style={{ color: '#666' }}>No comments yet.</p>
        ) : (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
          >
            {comments.map(comment => (
              <div
                key={comment.commentId}
                style={{
                  padding: '15px',
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '3px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'start',
                  }}
                >
                  <p style={{ margin: '0 0 10px 0', flex: 1 }}>
                    {comment.body}
                  </p>
                  {userId === comment.userIdOfCreator && (
                    <button
                      onClick={() =>
                        void handleDeleteComment(comment.commentId)
                      }
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '3px',
                        cursor: 'pointer',
                        fontSize: '0.85em',
                        marginLeft: '10px',
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '0.85em', color: '#666' }}>
                  <span>User: {comment.creatorName}</span>
                  <span style={{ margin: '0 10px' }}>•</span>
                  <span>
                    {new Date(comment.createdAt).toLocaleDateString()}{' '}
                    {new Date(comment.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
