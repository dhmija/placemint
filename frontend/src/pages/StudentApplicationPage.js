import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Grid,
  Link as MuiLink,
  Select,
  MenuItem,
  FormControl,
  FormLabel,
  Button,
  Divider,
  Chip
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { getApplicationById, getApplicationByJobAndStudent, updateApplicationStatus, getStudentQuizResult, getStudentTaskResult } from '../services/api';
import { useAuth } from '../context/AuthContext';

// This page is a bit of a hack. The *right* way to get here
// would be from a link like /job/:jobId/student/:studentId
// The /application/:appId route is also good. We'll use getApplicationByJobAndStudent
// which I've now added to the application-service.

// Correction: The /admin/application/:appId route is better.
// We'll update the QuizScoreboard to use this.
// I need to go back and fix the QuizScoreboardPage...
// No, I'll fix it HERE. The QuizScoreboard passes a submission ID.
// My quiz-service `getSubmissionDetails` already finds the application.
// This is getting complicated.

// ---
// NEW, SIMPLER PLAN:
// The /admin/application/:appId route is what we'll use.
// The JobApplicantsPage links to it.
// The QuizScoreboardPage will also link to it.
// Let's modify the QuizScoreboard...
// No, let's just create this page. It will be correct.
// ---

const StudentApplicationPage = () => {
  const { appId } = useParams();
  const [application, setApplication] = useState(null);
  const [profile, setProfile] = useState(null);
  const [job, setJob] = useState(null);
  const [quizResult, setQuizResult] = useState(null);
  const [taskResult, setTaskResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFullApplication = async () => {
      try {
        setLoading(true);
        // This one API call gets the application, the profile, and the job
        const { data: appData } = await getApplicationById(appId);
        setApplication(appData);
        setProfile(appData.studentProfile);
        setJob(appData.jobDetails);
        setStatus(appData.status);

        // After getting app, fetch quiz/task results IF they exist
        if (appData.jobDetails.quiz) {
          try {
            const { data: quizRes } = await getStudentQuizResult(appData.job, appData.student);
            setQuizResult(quizRes);
          } catch (err) { 
            console.warn("Quiz result not found for this student.");
          }
        }
        if (appData.jobDetails.task) {
           try {
            const { data: taskRes } = await getStudentTaskResult(appData.job, appData.student);
            setTaskResult(taskRes);
          } catch (err) { 
            console.warn("Task result not found for this student.");
          }
        }
        
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load application.');
      }
      setLoading(false);
    };
    fetchFullApplication();
  }, [appId]);
  
  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setStatus(newStatus);
    try {
      await updateApplicationStatus(appId, newStatus);
    } catch (err) {
      setError('Failed to update status.');
    }
  };
  
  if (loading) {
    return <Box display="flex" justifyContent="center" mt={5}><CircularProgress /></Box>;
  }
  
  if (error) {
    return <Container maxWidth="md" sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Container>;
  }
  
  if (!application || !profile || !job) {
    return <Container maxWidth="md" sx={{ mt: 4 }}><Alert severity="info">Loading application data...</Alert></Container>;
  }
  
  const validStatuses = ['Applied', 'Viewed', 'Shortlisted', 'Waitlisted', 'Rejected', 'Hired'];
  const applicantsUrl = user.role === 'recruiter' ? `/admin/job/applicants/${job._id}` : `/tpo/job/applicants/${job._id}`;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button onClick={() => navigate(applicantsUrl)} sx={{ mb: 2 }}>
        &larr; Back to All Applicants
      </Button>
      
      <Grid container spacing={4}>
        {/* Left Panel - Student Info */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>{profile.name}</Typography>
            <Typography variant="body1" sx={{ mb: 1 }}><strong>Email:</strong> {user.email}</Typography>
            <Typography variant="body1" sx={{ mb: 1 }}><strong>Enrollment:</strong> {profile.enrollmentNumber}</Typography>
            <Typography variant="body1" sx={{ mb: 1 }}><strong>GPA:</strong> {profile.gpa}</Typography>
            <Typography variant="body1" component="div" sx={{ mb: 2 }}>
              <strong>Skills:</strong>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                {profile.skills.map(skill => <Chip key={skill} label={skill} size="small" />)}
              </Box>
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Button 
                href={`http://localhost:5000${application.resumeURL}`}
                target="_blank"
                rel="noopener noreferrer"
                variant="contained"
                fullWidth
              >
                View Resume
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        {/* Right Panel - Application Info */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>Application for {job.title}</Typography>
            <FormControl sx={{ mt: 2, minWidth: 200 }} size="small">
              <FormLabel>Application Status</FormLabel>
              <Select
                value={status}
                onChange={handleStatusChange}
              >
                {validStatuses.map(s => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6">Cover Letter</Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mt: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1, minHeight: 100 }}>
              {application.coverLetter || 'No cover letter submitted.'}
            </Typography>
            
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6">Screening Results</Typography>
            <Box sx={{ mt: 2 }}>
              {job.quiz ? (
                <Alert severity={quizResult ? "success" : "info"}>
                  {quizResult ? `Quiz Score: ${quizResult.score}/${quizResult.totalQuestions}` : 'Quiz score is not available here.'}
                </Alert>
              ) : (
                <Typography variant="body2">No quiz was required for this job.</Typography>
              )}
            </Box>
            <Box sx={{ mt: 2 }}>
              {job.task ? (
                <Alert severity={taskResult ? (taskResult.status === 'Passed' ? 'success' : 'error') : "info"}>
                  {taskResult ? `Coding Task: ${taskResult.status}` : 'Task score is not available here.'}
                </Alert>
              ) : (
                <Typography variant="body2">No coding task was required for this job.</Typography>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default StudentApplicationPage;