import axios from 'axios';

// The API Gateway URL
const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
});

// Interceptor to add the auth token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Auth Service ---
export const registerUser = (userData) => api.post('/auth/register', userData);
export const loginUser = (userData) => api.post('/auth/login', userData);
export const sendVerificationOtp = (email) => api.post('/auth/send-otp', { email });
export const verifyOtp = (otpData) => api.post('/auth/verify-otp', otpData);
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });
export const verifyPasswordResetOtp = (otpData) => api.post('/auth/verify-reset-otp', otpData);
export const resetPassword = (passwordData) => api.post('/auth/reset-password', passwordData);

// --- Profile Service ---
export const getMyProfile = () => api.get('/profile/me');
export const createOrUpdateProfile = (profileData) => {
  return api.post('/profile', profileData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const getAllProfiles = () => api.get('/profile/all'); // For TPO

// --- Skills Service ---
export const getSkills = (query = '') => api.get(`/skills?search=${query}`);

// --- Job Service ---
export const getAllJobs = (params = {}) => api.get('/jobs', { params });
export const getMyJobs = () => api.get('/jobs/myjobs'); // For Recruiter
export const getJobById = (id) => api.get(`/jobs/${id}`);
export const createJob = (jobData) => api.post('/jobs', jobData);
export const updateJob = (id, jobData) => api.put(`/jobs/${id}`, jobData);
export const deleteJob = (id) => api.delete(`/jobs/${id}`);

// --- Application Service ---
export const applyToJob = (jobId, coverLetter) => api.post(`/applications/job/${jobId}/apply`, { coverLetter });
export const getMyApplications = () => api.get('/applications/my-applications');
export const getApplicationsForJob = (jobId) => api.get(`/applications/job/${jobId}`);
export const getApplicationById = (appId) => api.get(`/applications/${appId}`);
export const getApplicationByJobAndStudent = (jobId, studentId) => api.get(`/applications/job/${jobId}/student/${studentId}`);
export const updateApplicationStatus = (appId, status) => api.put(`/applications/${appId}/status`, { status });

// --- Notification Service ---
export const getMyNotifications = () => api.get('/notifications');
export const markNotificationAsRead = (id) => api.put(`/notifications/${id}/read`);
export const markAllNotificationsAsRead = () => api.put('/notifications/read-all');

// --- Quiz Service ---
export const createQuiz = (quizData) => api.post('/quiz', quizData);
export const getQuizForJob = (jobId) => api.get(`/quiz/job/${jobId}`);
export const submitQuiz = (jobId, answers) => api.post(`/quiz/job/${jobId}/submit`, { answers });
export const getQuizResults = (jobId) => api.get(`/quiz/job/${jobId}/results`);
export const getMyResult = (jobId) => api.get(`/quiz/job/${jobId}/my-result`);
export const getStudentQuizResult = (jobId, studentId) => api.get(`/quiz/job/${jobId}/student/${studentId}`);
export const getSubmissionDetails = (submissionId) => api.get(`/quiz/submission/${submissionId}`);

// --- Announcement Service ---
export const getAllAnnouncements = () => api.get('/announcements');
export const createAnnouncement = (data) => api.post('/announcements', data);
export const updateAnnouncement = (id, data) => api.put(`/announcements/${id}`, data);
export const deleteAnnouncement = (id) => api.delete(`/announcements/${id}`);

// --- Task Service (NEW) ---
export const createTask = (taskData) => api.post('/tasks', taskData);
export const getTaskForJob = (jobId) => api.get(`/tasks/job/${jobId}`);
export const submitTask = (jobId, code, languageId) => api.post(`/tasks/job/${jobId}/submit`, { code, languageId });
export const getTaskResults = (jobId) => api.get(`/tasks/job/${jobId}/results`);
export const getMyTaskResult = (jobId) => api.get(`/tasks/job/${jobId}/my-result`);
export const getStudentTaskResult = (jobId, studentId) => api.get(`/tasks/job/${jobId}/student/${studentId}`);

// --- Hackathon Service ---
export const getAllHackathons = () => api.get('/hackathons');
export const getActiveHackathons = () => api.get('/hackathons/active');
export const getHackathonById = (id) => api.get(`/hackathons/${id}`);
export const createHackathon = (hackathonData) => api.post('/hackathons/create', hackathonData);
export const updateHackathon = (id, hackathonData) => api.put(`/hackathons/${id}`, hackathonData);
export const deleteHackathon = (id) => api.delete(`/hackathons/${id}`);

// --- Hackathon Registration ---
export const registerTeamForHackathon = (hackathonId, registrationData) => api.post(`/hackathons/${hackathonId}/register`, registrationData);
export const getHackathonRegistrations = (hackathonId) => api.get(`/hackathons/${hackathonId}/registrations`);
export const getUserHackathonRegistrations = () => api.get('/hackathons/registrations/my');
export const getRegistrationById = (registrationId) => api.get(`/hackathons/registrations/${registrationId}`);
export const updateRegistration = (registrationId, updateData) => api.put(`/hackathons/registrations/${registrationId}`, updateData);
export const approveRegistration = (registrationId) => api.post(`/hackathons/registrations/${registrationId}/approve`);
export const rejectRegistration = (registrationId) => api.post(`/hackathons/registrations/${registrationId}/reject`);
export const cancelRegistration = (registrationId) => api.delete(`/hackathons/registrations/${registrationId}`);

// --- Interview Service (Mock Interviews with Gemini AI) ---
export const startInterview = (topic) => api.post('/interview/start', { topic });
export const submitInterviewAnswer = (interviewId, answer) => api.post('/interview/answer', { interviewId, answer });
export const endInterview = (interviewId) => api.post('/interview/end', { interviewId });
export const getInterview = (interviewId) => api.get(`/interview/${interviewId}`);
export const getStudentInterviews = () => api.get('/interview/student/me');

// --- Messaging Service ---
export const startConversation = (recipientId, jobId = null, interviewId = null) =>
  api.post('/messaging/conversations/start', { recipientId, jobId, interviewId });
export const getMyConversations = () => api.get('/messaging/conversations/me');
export const getConversation = (id) => api.get(`/messaging/conversations/${id}`);
export const sendMessage = (payload) => api.post('/messaging/messages', payload);
export const getMessages = (conversationId, page = 1, limit = 50) =>
  api.get(`/messaging/messages/${conversationId}?page=${page}&limit=${limit}`);
export const markConversationAsRead = (conversationId) => api.put(`/messaging/messages/${conversationId}/read`);
export const searchProfiles = (query, role = null) => {
  const params = new URLSearchParams({ query });
  if (role) params.append('role', role);
  return api.get(`/profile/search?${params.toString()}`);
};

export default api;