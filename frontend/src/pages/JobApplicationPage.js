import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Grid,
  Link,
  Select,
  MenuItem,
  FormControl,
  FormLabel,
  Button
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { getApplicationById, updateApplicationStatus, getMyResult, getMyTaskResult } from '../services/api';
import { useAuth } from '../context/AuthContext';

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
  
  const applicantsUrl = user.role === 'recruiter' ? `/admin/job/applicants/${job?.job}` : `/tpo/job/applicants/${job?.job}`;

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        setLoading(true);
        const { data: appData } = await getApplicationById(appId);
        setApplication(appData);
        setProfile(appData.studentProfile);
        setJob(appData.jobDetails);
        setStatus(appData.status);

        // After getting app, fetch quiz/task results IF they exist
        if (appData.jobDetails.quiz) {
          try {
            // HACK: We are using getMyResult, but we need getStudentResult
            // For now, this will fail, but shows the structure.
            // We need a new backend route: /quiz/job/:jobId/student/:studentId
            // const { data: quizRes } = await getQuizResultForStudent(appData.job, appData.student);
            // setQuizResult(quizRes);
          } catch (err) { console.log("Quiz result fetch failed (needs new endpoint)"); }
        }
        if (appData.jobDetails.task) {
           try {
            // const { data: taskRes } = await getTaskResultForStudent(appData.job, appData.student);
            // setTaskResult(taskRes);
          } catch (err) { console.log("Task result fetch failed (needs new endpoint)"); }
        }
        
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load application.');
      }
      setLoading(false);
    };
    fetchApplication();
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
  
  if (!application) return null;
  
  const validStatuses = ['Applied', 'Viewed', 'Shortlisted', 'Waitlisted', 'Rejected', 'Hired'];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Button onClick={() => navigate(applicantsUrl)} sx={{ mb: 2 }}>
        &larr; Back to All Applicants
      </Button>
      
      <Grid container spacing={4}>
        {/* Left Panel - Student Info */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>{profile?.name}</Typography>
            <Typography variant="body1"><strong>Email:</strong> {profile?.email || 'N/A'}</Typography>
            <Typography variant="body1"><strong>Enrollment:</strong> {profile?.enrollmentNumber}</Typography>
            <Typography variant="body1"><strong>GPA:</strong> {profile?.gpa}</Typography>
            <Typography variant="body1"><strong>Skills:</strong> {profile?.skills.join(', ')}</Typography>
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
            <Typography variant="h5" gutterBottom>Application for {job?.title}</Typography>
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
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mt: 1, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              {application.coverLetter || 'No cover letter submitted.'}
            </Typography>
            
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6">Screening Results</Typography>
            <Box sx={{ mt: 2 }}>
              {job?.quiz ? (
                <Alert severity={quizResult ? "success" : "info"}>
                  {quizResult ? `Quiz Score: ${quizResult.score}/${quizResult.totalQuestions}` : 'Quiz not yet linked (TODO)'}
                </Alert>
              ) : (
                <Typography variant="body2">No quiz was required for this job.</Typography>
              )}
            </Box>
            <Box sx={{ mt: 2 }}>
              {job?.task ? (
                <Alert severity={taskResult ? (taskResult.status === 'Passed' ? 'success' : 'error') : "info"}>
                  {taskResult ? `Coding Task: ${taskResult.status}` : 'Task not yet linked (TODO)'}
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