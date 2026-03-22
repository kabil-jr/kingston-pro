import React, { useState } from 'react';
import { formatDate, dueLabel, dueStatus, statusBarColor, chipClass } from '../utils';
import AssignmentForm from './AssignmentForm';
import { db, storage } from '../firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';

export default function AdminPortal({ setScreen, assignments, showToast }) {
  const [showForm, setShowForm] = useState(false);

  const doLogout = () => {
    sessionStorage.removeItem('isAdmin');
    setScreen('landing');
    showToast('Signed out successfully');
  };

  const deleteAssignment = async (id) => {
    if (!window.confirm('Delete this assignment? Students will no longer see it.')) return;
    
    const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
    if (!isAdmin) {
       showToast('⚠️ Session expired');
       setScreen('admin-login');
       return;
    }

    try {
      const a = assignments.find(item => item.id === id);
      if (a && a.storagePath) {
        await deleteObject(ref(storage, a.storagePath)).catch(console.error);
      }
      await deleteDoc(doc(db, 'assignments', id));
      showToast('🗑 Assignment deleted');
    } catch (e) {
      console.error(e);
      showToast('⚠️ Delete failed');
    }
  };

  return (
    <div id="admin-portal" className="screen active">
      <nav className="shell-nav">
        <span className="nav-brand">KEC Assign</span>
        <span style={{ flex: 1 }}></span>
        <span className="nav-role adm" style={{ marginRight: '10px' }}>Admin</span>
        <button className="btn-logout" onClick={doLogout}>Sign out</button>
      </nav>
      
      <div className="shell-body">
        <div className="adm-main">
          <div className="adm-header">
            <div>
              <h1>Assignments</h1>
              <p>
                {assignments.length === 0 
                  ? 'No assignments yet' 
                  : `${assignments.length} assignment${assignments.length === 1 ? '' : 's'} posted`}
              </p>
            </div>
            <button className="btn-create" onClick={() => setShowForm(true)}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              New Assignment
            </button>
          </div>
          
          <div className="asgn-grid">
            {assignments.length === 0 ? (
              <div className="empty-state">
                <div className="e-ico">📭</div>
                <h3>No assignments yet</h3>
                <p>Click "New Assignment" to create your first one.<br/>Students will see it immediately after posting.</p>
              </div>
            ) : (
              assignments.map(a => {
                const st = dueStatus(a.due);
                return (
                  <div className="asgn-item" key={a.id}>
                    <div className="asgn-item-head">
                      <div className="asgn-status-bar" style={{ background: statusBarColor(st) }}></div>
                      <div className="asgn-info">
                        <div className="asgn-title">{a.title}</div>
                        <div className="asgn-course">{a.course}</div>
                      </div>
                      <div className="asgn-actions">
                        <button className="btn-sm danger" onClick={() => deleteAssignment(a.id)}>Delete</button>
                      </div>
                    </div>
                    <div className="asgn-footer">
                      <span className={chipClass(st)}>
                        <span className="chip-dot"></span>{dueLabel(a.due)}
                      </span>
                      <span className="chip" style={{ background: '#f0f4f9', color: 'var(--ink2)' }}>
                        📅 {formatDate(a.due)}
                      </span>
                      {a.pdfName ? (
                        <span className="chip pdf" title={a.pdfName}>📋 {a.pdfName}</span>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--ink3)', fontStyle: 'italic' }}>No PDF attached</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <AssignmentForm 
        isOpen={showForm} 
        onClose={() => setShowForm(false)} 
        showToast={showToast}
        setScreen={setScreen}
      />
    </div>
  );
}
