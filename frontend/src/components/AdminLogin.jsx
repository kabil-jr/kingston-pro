import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

export default function AdminLogin({ setScreen, showToast }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const doLogin = async () => {
    try {
      // Firebase Auth requires email, so we map the 'admin' username to admin@kec.com
      const email = username === 'admin' ? 'admin@kec.com' : username;
      await signInWithEmailAndPassword(auth, email, password);
      
      sessionStorage.setItem('isAdmin', 'true');
      setError(false);
      setScreen('admin-portal');
      showToast('Welcome back, Admin');
    } catch (e) {
      console.error(e);
      setError(true);
      setPassword('');
      showToast('⚠️ Login failed: ' + e.message);
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
