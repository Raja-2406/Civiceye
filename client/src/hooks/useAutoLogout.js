import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function useAutoLogout(timeoutMs = 900000) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const timerRef = useRef(null);

  useEffect(() => {
    // Only track inactivity if a user is currently logged in
    if (!user) return;

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        logout();
        navigate('/login');
      }, timeoutMs);
    };

    // Initialize the timer on mount
    resetTimer();

    // The events we consider as "activity"
    const events = ['mousemove', 'keydown', 'scroll', 'click'];

    // Attach event listeners to the window
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Cleanup event listeners and timer on unmount
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, [logout, navigate, timeoutMs, user]);
}
