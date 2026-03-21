import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Link as MuiLink,
  Select,
  MenuItem,
  FormControl,
  Button,
  Stack
} from '@mui/material';
import { useParams, Link as RouterLink } from 'react-router-dom';
import { getApplicationsForJob, updateApplicationStatus, getJobById } from '../services/api';
import { Assessment, Code } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const JobApplicantsPage = () => {
  const { id } = useParams(); // Job ID
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  
  const quizScoreboardUrl = user.role === 'recruiter' ? `/admin/job/${id}/scoreboard` : `/tpo/job/${id}/scoreboard`;
  const taskScoreboardUrl = user.role === 'recruiter' ? `/admin/job/${id}/task-results` : `/tpo/job/${id}/task-results`;
  const applicationUrl = (appId) => user.role === 'recruiter' ? `/admin/application/${appId}` : `/tpo/application/${appId}`;


  const fetchApplicants = async () => {
    try {
      setLoading(true);
      const jobRes = await getJobById(id);
      setJob(jobRes.data);
      const appRes = await getApplicationsForJob(id);
      setApplications(appRes.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load applicants.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchApplicants();
  }, [id]);

  const handleStatusChange = async (appId, newStatus) => {
    try {
      await updateApplicationStatus(appId, newStatus);
      // Update local state to reflect change instantly
      setApplications(prev =>
        prev.map(app => (app._id === appId ? { ...app, status: newStatus } : app))
      );
    } catch (err) {
      setError('Failed to update status. Please try again.');
    }
  };

  if (loading) {
    return <Box display="flex" justifyContent="center" mt={5}><CircularProgress /></Box>;
  }
  
  const validStatuses = ['Applied', 'Viewed', 'Shortlisted', 'Waitlisted', 'Rejected', 'Hired'];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Applicants for {job?.title || 'Job'}
          </Typography>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            {job?.company}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          {job?.quiz && (
            <Button
              component={RouterLink}
              to={quizScoreboardUrl}
              variant="contained"
              color="secondary"
              startIcon={<Assessment />}
            >
              Quiz Scoreboard
            </Button>
          )}
          {job?.task && (
            <Button
              component={RouterLink}
              to={taskScoreboardUrl}
              variant="contained"
              color="info"
              startIcon={<Code />}
            >
              Task Results
            </Button>
          )}
        </Stack>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {applications.length === 0 ? (
        <Typography>There are no applications for this job yet.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Applicant Name</TableCell>
                <TableCell>Enrollment No.</TableCell>
                <TableCell>GPA</TableCell>
                <TableCell>Resume</TableCell>
                <TableCell>Applied On</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {applications.map((app) => (
                <TableRow hover key={app._id}>
                  <TableCell>
                    {/* --- NEW --- Link to the student's application page */}
                    <RouterLink to={applicationUrl(app._id)}>
                      {app.studentProfile?.name || 'N/A'}
                    </RouterLink>
                  </TableCell>
                  <TableCell>{app.studentProfile?.enrollmentNumber || 'N/A'}</TableCell>
                  <TableCell>{app.studentProfile?.gpa || 'N/A'}</TableCell>
                  <TableCell>
                    <MuiLink
                      href={`http://localhost:5000${app.resumeURL}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View Resume
                    </MuiLink>
                  </TableCell>
                  <TableCell>{new Date(app.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <FormControl size="small" variant="standard" sx={{ minWidth: 120 }}>
                      <Select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app._id, e.target.value)}
                      >
                        {validStatuses.map(status => (
                          <MenuItem key={status} value={status}>{status}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default JobApplicantsPage;