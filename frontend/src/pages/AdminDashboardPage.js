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
  Button,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import { Add, Edit, Delete, People, Assessment, AddTask, Code, WorkOutlineIcon } from '@mui/icons-material';
import WorkOutlineOutlinedIcon from '@mui/icons-material/WorkOutlineOutlined';
import { getMyJobs, deleteJob } from '../services/api';
import { Link as RouterLink } from 'react-router-dom';

const AdminDashboardPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const { data } = await getMyJobs();
      setJobs(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load jobs.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
  }, []);
  
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this job? This will also delete its quiz, task, and all submissions.')) {
      try {
        await deleteJob(id);
        fetchJobs(); // Refresh the list
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete job.');
      }
    }
  };

  if (loading) {
    return <Box display="flex" justifyContent="center" mt={5}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: 'calc(100vh - 64px)', p: 3 }}>
      <Container maxWidth="lg">
        <Paper elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: '8px', p: 3, bgcolor: '#f9f9f9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          {/* Header with Icon */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <WorkOutlineOutlinedIcon sx={{ color: 'primary.main', fontSize: '2rem' }} />
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
              My Job Postings
            </Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />

          {/* If not authorized, show a friendly CTA to login */}
          {String(error).toLowerCase().includes('not authorized') && (
            <Alert severity="warning" sx={{ mb: 2 }} action={
              <Button component={RouterLink} to="/login" color="inherit" size="small">
                Sign In
              </Button>
            }>
              You are not signed in or your session has expired. Sign in to view your job postings.
            </Alert>
          )}

          <Box display="flex" justifyContent="flex-end" alignItems="center" mb={3}>
            <Button
              component={RouterLink}
              to="/admin/job/new"
              variant="contained"
              color="primary"
              startIcon={<Add />}
            >
              Post New Job
            </Button>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          {jobs.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="textSecondary">
                You have not posted any jobs yet.
              </Typography>
              <Button
                component={RouterLink}
                to="/admin/job/new"
                variant="contained"
                color="primary"
                sx={{ mt: 2 }}
                startIcon={<Add />}
              >
                Post Your First Job
              </Button>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Title</TableCell>
                    <TableCell>Company</TableCell>
                    <TableCell>Posted On</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow hover key={job._id}>
                      <TableCell>{job.title}</TableCell>
                      <TableCell>{job.company}</TableCell>
                      <TableCell>{new Date(job.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Tooltip title="View Applicants">
                          <IconButton
                            component={RouterLink}
                            to={`/admin/job/applicants/${job._id}`}
                            color="primary"
                          >
                            <People />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Job">
                          <IconButton
                            component={RouterLink}
                            to={`/admin/job/edit/${job._id}`}
                            color="secondary"
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        
                        {/* --- NEW QUIZ BUTTONS --- */}
                        <Tooltip title={job.quiz ? "Edit Quiz" : "Add Quiz"}>
                          <IconButton
                            component={RouterLink}
                            to={`/admin/job/${job._id}/quiz`}
                            color="default"
                          >
                            <AddTask />
                          </IconButton>
                        </Tooltip>
                        {job.quiz && (
                           <Tooltip title="View Quiz Scoreboard">
                            <IconButton
                              component={RouterLink}
                              to={`/admin/job/${job._id}/scoreboard`}
                              color="secondary"
                            >
                              <Assessment />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {/* --- NEW TASK BUTTONS --- */}
                        <Tooltip title={job.task ? "Edit Task" : "Add Coding Task"}>
                          <IconButton
                            component={RouterLink}
                            to={`/admin/job/${job._id}/task`}
                            color="default"
                          >
                            <Code />
                          </IconButton>
                        </Tooltip>
                        {job.task && (
                           <Tooltip title="View Task Results">
                            <IconButton
                              component={RouterLink}
                              to={`/admin/job/${job._id}/task-results`}
                              color="secondary"
                            >
                              <Assessment />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        <Tooltip title="Delete Job">
                          <IconButton
                            onClick={() => handleDelete(job._id)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default AdminDashboardPage;