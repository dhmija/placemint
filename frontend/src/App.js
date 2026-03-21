import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Box, CircularProgress } from '@mui/material';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyOtpPage from './pages/VerifyOtpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import VerifyResetOtpPage from './pages/VerifyResetOtpPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

import StudentDashboardPage from './pages/StudentDashboardPage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import StudentApplicationPage from './pages/StudentApplicationPage';
import MyApplicationsPage from './pages/MyApplicationsPage';
import QuizTakePage from './pages/QuizTakePage';
import TaskTakePage from './pages/TaskTakePage';
import MockInterviewPage from './pages/MockInterviewPage';
import InterviewHistoryPage from './pages/InterviewHistoryPage';

import AdminDashboardPage from './pages/AdminDashboardPage';
import EditJobPage from './pages/EditJobPage';
import JobApplicantsPage from './pages/JobApplicantsPage';
import JobDetailsPage from './pages/JobDetailsPage';
import JobApplicationFormPage from './pages/JobApplicationFormPage';
import QuizCreatePage from './pages/QuizCreatePage';
import TaskCreatePage from './pages/TaskCreatePage';
import AnnouncementForm from './pages/AnnouncementForm';
import QuizScoreboardPage from './pages/QuizScoreboardPage';
import TaskScoreboardPage from './pages/TaskScoreboardPage';

import TPODashboardPage from './pages/TPODashboardPage';
import HackathonsPage from './pages/HackathonsPage';
import HackathonDetailsPage from './pages/HackathonDetailsPage';
import HackathonRegistrationPage from './pages/HackathonRegistrationPage';
import HackathonManagementPage from './pages/HackathonManagementPage';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import NavbarWrapper from './components/NavbarWrapper';

const App = () => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-otp" element={<VerifyOtpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/verify-reset-otp" element={<VerifyResetOtpPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected Routes */}
      <Route element={<ProtectedRoute roles={['student', 'recruiter', 'placementcell', 'verifier']} />}>
        <Route element={<NavbarWrapper />}>
          {/* Student Routes */}
          <Route path="/dashboard" element={<StudentDashboardPage />} />
          <Route path="/hackathons" element={<HackathonsPage />} />
          <Route path="/hackathons/:hackathonId" element={<HackathonDetailsPage />} />
          <Route path="/hackathons/:hackathonId/register" element={<HackathonRegistrationPage />} />
          <Route path="/job/:jobId" element={<JobDetailsPage />} />
          <Route path="/application/apply/:jobId" element={<JobApplicationFormPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/student/applications" element={<StudentApplicationPage />} />
          <Route path="/my-applications" element={<MyApplicationsPage />} />
          <Route path="/quizzes/take/:jobId" element={<QuizTakePage />} />
          <Route path="/tasks/take/:jobId" element={<TaskTakePage />} />
          <Route path="/mock-interview/:topic" element={<MockInterviewPage />} />
          <Route path="/interview-history" element={<InterviewHistoryPage />} />
          <Route path="/quizzes/scoreboard" element={<QuizScoreboardPage />} />
          <Route path="/tasks/scoreboard" element={<TaskScoreboardPage />} />

          {/* Admin/Recruiter Routes - with Navbar */}
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/job/new" element={<EditJobPage />} />
          <Route path="/admin/job/edit/:id" element={<EditJobPage />} />
          <Route path="/admin/job/applicants/:id" element={<JobApplicantsPage />} />
          <Route path="/admin/job/:id/quiz" element={<QuizCreatePage />} />
          <Route path="/admin/job/:id/task" element={<TaskCreatePage />} />
          <Route path="/admin/job/:id/scoreboard" element={<QuizScoreboardPage />} />
          <Route path="/admin/job/:id/task-results" element={<TaskScoreboardPage />} />
          <Route path="/admin/application/:appId" element={<StudentApplicationPage />} />
          <Route path="/admin/quizzes/new" element={<QuizCreatePage />} />
          <Route path="/admin/tasks/new" element={<TaskCreatePage />} />
          <Route path="/admin/announcements" element={<AnnouncementForm />} />

          {/* TPO Routes */}
          <Route path="/tpo/dashboard" element={<TPODashboardPage />} />
          <Route path="/tpo/hackathons/manage" element={<HackathonManagementPage />} />
          <Route path="/tpo/job/new" element={<EditJobPage />} />
          <Route path="/tpo/job/edit/:id" element={<EditJobPage />} />
          <Route path="/tpo/job/:id/quiz" element={<QuizCreatePage />} />
          <Route path="/tpo/job/:id/task" element={<TaskCreatePage />} />
          <Route path="/tpo/job/:id/scoreboard" element={<QuizScoreboardPage />} />
          <Route path="/tpo/job/:id/task-results" element={<TaskScoreboardPage />} />
          <Route path="/tpo/application/:appId" element={<StudentApplicationPage />} />
          <Route path="/tpo/announcement/new" element={<AnnouncementForm />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default App;