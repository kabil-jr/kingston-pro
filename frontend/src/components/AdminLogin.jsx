import React, { useState } from 'react';

export default function AdminLogin({ setScreen, showToast }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const doLogin = async () => {
    // Basic credential check for frontend-only auth
    if (username === 'admin' && password === 'kec123') {
      sessionStorage.setItem('isAdmin', 'true');
      sessionStorage.setItem('adminUser', 'admin');
      setError(false);
      setScreen('admin-portal');
    } else {
      setError(true);
      setPassword('');
      showToast('⚠️ Incorrect username or password');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') doLogin();
  };

  return (
    <div id="admin-login" className="screen active">
      <div className="land-bg"></div>
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px', width: '100%' }}>
        <div className="login-box">
          <div className="login-logo">
            <span>KEC Assign</span>
            <sub>Portal</sub>
          </div>
          <h2>Admin Sign In</h2>
          <p className="login-sub">Enter your credentials to access the admin portal.</p>
          
          <div className={`login-error ${error ? 'show' : ''}`}>
            Incorrect username or password. Please try again.
          </div>
          
          <div className="login-field">
            <label>Username</label>
            <input 
              type="text" 
              placeholder="Enter username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <div className="login-field">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="Enter password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          
          <button className="btn-login" onClick={doLogin}>Sign In →</button>
          <button className="login-back" onClick={() => setScreen('landing')}>← Back to portal selection</button>
        </div>
      </div>
    </div>
  );
}
