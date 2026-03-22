import React from 'react';

export default function Landing({ setScreen }) {
  return (
    <div id="landing" className="screen active">
      <div className="land-bg"></div>
      <div className="land-inner">
        <div>
          <div className="land-logo">
            <span>KEC Assign</span>
            <sub>Portal</sub>
          </div>
          <p className="land-tagline">
            A unified assignment portal for KEC — post assignments with answer PDFs, students view and download instantly.
          </p>
        </div>
        <div className="portal-grid">
          <div className="p-card adm" onClick={() => setScreen('admin-login')}>
            <div className="p-ico adm">🧑‍🏫</div>
            <div>
              <h2>Admin Portal</h2>
              <p>Create assignments, attach answer PDFs, set due dates</p>
            </div>
            <span className="p-arrow">↗</span>
          </div>
          <div className="p-card stu" onClick={() => setScreen('student-portal')}>
            <div className="p-ico stu">🎒</div>
            <div>
              <h2>Student Portal</h2>
              <p>View assignments & download answer sheets posted by admin</p>
            </div>
            <span className="p-arrow">↗</span>
          </div>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--ink3)' }}>
          Click a portal to enter · No login required for preview
        </p>
      </div>
    </div>
  );
}
