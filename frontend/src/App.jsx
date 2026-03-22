import { useState, useEffect } from 'react';
import Landing from './components/Landing';
import AdminLogin from './components/AdminLogin';
import AdminPortal from './components/AdminPortal';
import StudentPortal from './components/StudentPortal';
import Toast from './components/Toast';
import { db } from './firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

export default function App() {
  const [screen, setScreen] = useState('landing');
  const [assignments, setAssignments] = useState([]);
  const [toastMsg, setToastMsg] = useState('');
  
  const showToast = (msg, duration = 2800) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), duration);
  };

  useEffect(() => {
    // Listen to real-time updates from Firestore
    const q = query(collection(db, 'assignments'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAssignments(list);
    }, (error) => {
      console.error("Failed to load assignments", error);
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      <div id="root-container">
        {screen === 'landing' && <Landing setScreen={setScreen} />}
        {screen === 'admin-login' && <AdminLogin setScreen={setScreen} showToast={showToast} />}
        {screen === 'admin-portal' && (
          <AdminPortal 
            setScreen={setScreen} 
            assignments={assignments} 
            showToast={showToast} 
          />
        )}
        {screen === 'student-portal' && (
          <StudentPortal 
            setScreen={setScreen} 
            assignments={assignments} 
            showToast={showToast} 
          />
        )}
      </div>
      <Toast message={toastMsg} />
    </>
  );
}
