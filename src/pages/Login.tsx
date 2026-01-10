import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { analyticsService } from '../services/analyticsService';

export const Login = () => {
  const [orgId, setOrgId] = useState('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
  const [email, setEmail] = useState('alice@acme.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [orgIdError, setOrgIdError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    void analyticsService.trackPageView('login');
  }, []);

  const validateEmail = (value: string): string => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return 'Please enter a valid email address';
    }
    return '';
  };

  const validatePassword = (value: string): string => {
    if (value.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    return '';
  };

  const validateUUID = (value: string): string => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(value)) {
      return 'Please enter a valid UUID';
    }
    return '';
  };

  const handleOrgIdChange = (value: string) => {
    setOrgId(value);
    setOrgIdError(validateUUID(value));
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setEmailError(validateEmail(value));
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordError(validatePassword(value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const orgIdErr = validateUUID(orgId);
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);

    setOrgIdError(orgIdErr);
    setEmailError(emailErr);
    setPasswordError(passwordErr);

    if (orgIdErr || emailErr || passwordErr) {
      return;
    }

    void (async () => {
      try {
        await login({ orgId, email, password });
        await Promise.resolve(navigate('/tasks'));
      } catch {
        setError('Invalid credentials. Please try again.');
      }
    })();
  };

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label
            htmlFor="orgId"
            style={{ display: 'block', marginBottom: '5px' }}
          >
            Organization ID
          </label>
          <input
            id="orgId"
            type="text"
            value={orgId}
            onChange={e => handleOrgIdChange(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
          {orgIdError && (
            <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
              {orgIdError}
            </div>
          )}
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label
            htmlFor="email"
            style={{ display: 'block', marginBottom: '5px' }}
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => handleEmailChange(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
          {emailError && (
            <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
              {emailError}
            </div>
          )}
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label
            htmlFor="password"
            style={{ display: 'block', marginBottom: '5px' }}
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => handlePasswordChange(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
          {passwordError && (
            <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
              {passwordError}
            </div>
          )}
        </div>
        {error && (
          <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>
        )}
        <button
          type="submit"
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#007bff',
            color: 'white',
          }}
        >
          Login
        </button>
      </form>
      <p style={{ marginTop: '15px', textAlign: 'center' }}>
        Don't have an account? <Link to="/signup">Sign up</Link>
      </p>
    </div>
  );
};
