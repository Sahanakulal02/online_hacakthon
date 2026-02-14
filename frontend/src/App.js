import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import QuizList from './pages/QuizList';
import TakeQuiz from './pages/TakeQuiz';
import QuizResult from './pages/QuizResult';
import StudentAnalytics from './pages/StudentAnalytics';
import TeacherDashboard from './pages/TeacherDashboard';
import TeacherAlerts from './pages/TeacherAlerts';
import CreateQuiz from './pages/CreateQuiz';
import Leaderboard from './pages/Leaderboard';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/student/dashboard"
              element={
                <PrivateRoute>
                  <StudentDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/student/quizzes"
              element={
                <PrivateRoute>
                  <QuizList />
                </PrivateRoute>
              }
            />
            <Route
              path="/student/quiz/:quizId"
              element={
                <PrivateRoute>
                  <TakeQuiz />
                </PrivateRoute>
              }
            />
            <Route
              path="/student/result/:attemptId"
              element={
                <PrivateRoute>
                  <QuizResult />
                </PrivateRoute>
              }
            />
            <Route
              path="/student/analytics"
              element={
                <PrivateRoute>
                  <StudentAnalytics />
                </PrivateRoute>
              }
            />
            <Route
              path="/teacher/dashboard"
              element={
                <PrivateRoute role="teacher">
                  <TeacherDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/teacher/create-quiz"
              element={
                <PrivateRoute role="teacher">
                  <CreateQuiz />
                </PrivateRoute>
              }
            />
            <Route
              path="/teacher/alerts"
              element={
                <PrivateRoute role="teacher">
                  <TeacherAlerts />
                </PrivateRoute>
              }
            />
            <Route
              path="/leaderboard"
              element={<Leaderboard />}
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
          <Toaster position="top-right" />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

