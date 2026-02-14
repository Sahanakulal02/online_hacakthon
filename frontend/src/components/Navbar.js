import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          🎮 Gamified Learning
        </Link>
        <div className="navbar-links">
          {user ? (
            <>
              {user.role === 'student' ? (
                <>
                  <Link to="/student/dashboard">Dashboard</Link>
                  <Link to="/student/quizzes">Quizzes</Link>
                  <Link to="/student/analytics">Analytics</Link>
                  <Link to="/leaderboard">Leaderboard</Link>
                </>
              ) : (
                <>
                  <Link to="/teacher/dashboard">Dashboard</Link>
                  <Link to="/teacher/create-quiz">Create Quiz</Link>
                  <Link to="/teacher/alerts">Alerts</Link>
                </>
              )}
              <span className="user-info">
                {user.name} ({user.role})
                {user.level && <span className="level">Level {user.level}</span>}
              </span>
              <button onClick={handleLogout} className="btn-logout">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

