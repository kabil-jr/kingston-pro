import React, { useState, useRef } from 'react';
import { formatBytes } from '../utils';
import { db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function AssignmentForm({ isOpen, onClose, showToast, setScreen }) {
  const [title, setTitle] = useState('');
  const [course, setCourse] = useState('');
  const [desc, setDesc] = useState('');
  const [due, setDue] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDrag, setIsDrag] = useState(false);
  
  const fileInputRef = useRef(null);

  const valid = title.trim() && course.trim() && due;

  const reset = () => {
    setTitle('');
    setCourse('');
    setDesc('');
    setDue('');
    setFile(null);
    if(fileInputRef.current) fileInputRef.current.value = '';
  };

  const wrapClose = () => {
    reset();
    onClose();
  };

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.type !== 'application/pdf' && !f.name.endsWith('.pdf')) {
      showToast('⚠️ Please upload a PDF file only');
      e.target.value = '';
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      showToast('⚠️ File too large — max 20 MB');
      e.target.value = '';
      return;
    }
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDrag(false);
    const f = e.dataTransfer.files[0];
    if (f) {
      if(fileInputRef.current) fileInputRef.current.files = e.dataTransfer.files;
      handleFile({ target: { files: [f] } });
    }
  };

  const createAssignment = async () => {
    if (!valid) return;
    
    // Check local session
    const isAdmin = sessionStorage.getItem('isAdmin') === 'true';
    if (!isAdmin) {
       showToast('⚠️ Session expired. Please log in again.');
       setScreen('admin-login');
       return;
    }

    setLoading(true);

    try {
      let pdfUrl = null;
      let pdfName = null;
      let storagePath = null;

      if (file) {
        const uniqueName = `uploads/${Date.now()}-${file.name}`;
        const fileRef = ref(storage, uniqueName);
        const snapshot = await uploadBytes(fileRef, file);
        pdfUrl = await getDownloadURL(snapshot.ref);
        pdfName = file.name;
        storagePath = uniqueName;
      }

      await addDoc(collection(db, 'assignments'), {
        title:  title.trim(),
        course: course.trim(),
        desc:   desc.trim(),
        due,
        createdAt: serverTimestamp(),
        pdfName,
        pdfUrl,
        storagePath
      });

      showToast('✅ Assignment posted to Firebase!');
      wrapClose();
    } catch (e) {
      console.error(e);
      showToast('⚠️ Error posting: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`form-overlay ${isOpen ? 'open' : ''}`}>
      <div className="form-backdrop" onClick={wrapClose}></div>
      <div className="form-panel">
        <div className="form-head">
          <h2>New Assignment</h2>
          <button className="form-close" onClick={wrapClose}>✕</button>
        </div>
        
        <div className="form-body">
          <div className="field">
            <label>Assignment Title *</label>
            <input type="text" placeholder="e.g. Problem Set 4 — Linear Algebra" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="field">
            <label>Course / Subject *</label>
            <input type="text" placeholder="e.g. MTH 202 — Differential Equations" value={course} onChange={(e) => setCourse(e.target.value)} />
          </div>
          <div className="field">
            <label>Description / Instructions</label>
            <textarea placeholder="Describe what students need to do..." value={desc} onChange={(e) => setDesc(e.target.value)}></textarea>
          </div>
          <div className="field">
            <label>Due Date & Time *</label>
            <input type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
          </div>
          <div className="field">
            <label>Handwritten Answer PDF</label>
            {!file ? (
              <div 
                className={`upload-zone ${isDrag ? 'drag' : ''}`} 
                onDragOver={(e) => { e.preventDefault(); setIsDrag(true); }}
                onDragLeave={() => setIsDrag(false)}
                onDrop={handleDrop}
              >
                <input type="file" ref={fileInputRef} accept=".pdf,application/pdf" onChange={handleFile} />
                <div className="upload-ico">📄</div>
                <div className="upload-txt">Click to upload or drag & drop</div>
                <div className="upload-sub">PDF only · Max 20 MB</div>
              </div>
            ) : (
              <div className="upload-preview visible">
                <div className="pdf-icon">📋</div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div className="upload-name">{file.name}</div>
                  <div className="upload-size">{formatBytes(file.size)}</div>
                </div>
                <button className="remove-file" onClick={() => setFile(null)} title="Remove">✕</button>
              </div>
            )}
          </div>
        </div>
        
        <div className="form-footer">
          <button className="btn-cancel" onClick={wrapClose}>Cancel</button>
          <button className="btn-submit" onClick={createAssignment} disabled={!valid || loading}>
            {loading ? "Posting..." : "Post Assignment"}
          </button>
        </div>
      </div>
    </div>
  );
}
