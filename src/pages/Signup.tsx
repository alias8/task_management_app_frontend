import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Signup = () => {
  const [orgId, setOrgId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [orgIdError, setOrgIdError] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

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

  const validateName = (value: string): string => {
    if (value.trim() === '') {
      return 'Name cannot be empty';
    }
    return '';
  };

  const handleOrgIdChange = (value: string) => {
    setOrgId(value);
    setOrgIdError(validateUUID(value));
  };

  const handleNameChange = (value: string) => {
    setName(value);
    setNameError(validateName(value));
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
    const nameErr = validateName(name);
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);

    setOrgIdError(orgIdErr);
    setNameError(nameErr);
    setEmailError(emailErr);
    setPasswordError(passwordErr);

    if (orgIdErr || nameErr || emailErr || passwordErr) {
      return;
    }

    void (async () => {
      try {
        await signup({ orgId, name, email, password });
        await Promise.resolve(navigate('/login'));
      } catch {
        setError('Failed to create account. Please try again.');
      }
    })();
  };

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px' }}>
      <h2>Sign Up</h2>
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
            htmlFor="name"
            style={{ display: 'block', marginBottom: '5px' }}
          >
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={e => handleNameChange(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
          />
          {nameError && (
            <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
              {nameError}
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
            Password (min 6 characters)
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => handlePasswordChange(e.target.value)}
            required
            minLength={6}
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
        <button type="submit" style={{ width: '100%', padding: '10px' }}>
          Sign Up
        </button>
      </form>
      <p style={{ marginTop: '15px', textAlign: 'center' }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
};
