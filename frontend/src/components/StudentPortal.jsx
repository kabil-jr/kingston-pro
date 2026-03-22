import React from 'react';
import { formatDate, dueLabel, dueStatus, statusBarColor } from '../utils';

export default function StudentPortal({ setScreen, assignments, showToast }) {
  const downloadPdf = (id) => {
    const a = assignments.find(x => x.id === id);
    if (!a || !a.pdfName) {
      showToast('No PDF available');
      return;
    }
    if (a.pdfUrl) {
      const link = document.createElement('a');
      link.href = a.pdfUrl;
      link.download = a.pdfName;
      link.click();
      showToast('⬇️ Downloading ' + a.pdfName);
    }
  };

  const sorted = [...assignments].sort((a, b) => {
    const sa = dueStatus(a.due);
    const sb = dueStatus(b.due);
    const order = { over: 0, soon: 1, ok: 2 };
    if (order[sa] !== order[sb]) return order[sa] - order[sb];
    return new Date(a.due) - new Date(b.due);
  });

  return (
    <div id="student-portal" className="screen active">
      <nav className="shell-nav">
        <button className="nav-back" onClick={() => setScreen('landing')}>← Back</button>
        <span className="nav-brand">KEC Assign</span>
        <span style={{ flex: 1 }}></span>
        <span className="nav-role stu">Student</span>
      </nav>
      
      <div className="shell-body">
        <div className="stu-main">
          <div className="stu-header">
            <h1>Your Assignments</h1>
            <p>
              {assignments.length === 0 
                ? 'No assignments posted yet' 
                : `${assignments.length} assignment${assignments.length === 1 ? '' : 's'} from your admin`}
            </p>
          </div>
          
          <div id="stu-list">
            {assignments.length === 0 ? (
              <div className="empty-state">
                <div className="e-ico">🎉</div>
                <h3>All clear!</h3>
                <p>No assignments have been posted yet.<br/>Check back soon.</p>
              </div>
            ) : (
              sorted.map(a => {
                const st = dueStatus(a.due);
                const statusClass = st === 'over' ? 'sb-over' : st === 'soon' ? 'sb-soon' : 'sb-ok';
                const hasPdf = !!a.pdfName;
                const borderColor = statusBarColor(st);

                return (
                  <div className="stu-card" style={{ borderLeft: `4px solid ${borderColor}` }} key={a.id}>
                    <div className="stu-card-inner">
                      <div className="stu-card-top">
                        <div className="stu-card-left">
                          <h3>{a.title}</h3>
                          <span className="stu-course-badge">{a.course}</span>
                        </div>
                        <div className="stu-due">
                          <div className="due-label">Due</div>
                          <div className={`due-date ${st}`}>{formatDate(a.due)}</div>
                        </div>
                      </div>
                      
                      {a.desc && <div className="stu-desc">{a.desc}</div>}
                      
                      <div className="stu-card-footer">
                        <span className={`status-badge ${statusClass}`}>{dueLabel(a.due)}</span>
                        {hasPdf ? (
                          <>
                            <button className="btn-download" onClick={() => downloadPdf(a.id)}>
                              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              Download Answer PDF
                            </button>
                            <span style={{ fontSize: '11px', color: 'var(--ink3)' }}>
                              {a.pdfName} · {a.pdfSize || '—'}
                            </span>
                          </>
                        ) : (
                          <span className="no-pdf-note">No answer PDF attached for this assignment</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
