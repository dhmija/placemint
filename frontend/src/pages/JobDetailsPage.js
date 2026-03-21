import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Button,
  Divider,
  Grid,
  Chip,
  Stack,
  Card,
  CardContent
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { getJobById, applyToJob, getMyApplications } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Business, LocationOn, Work, School } from '@mui/icons-material';

const JobDetailsPage = () => {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        console.log('Fetching job with ID:', jobId);
        const { data: jobData } = await getJobById(jobId);
        console.log('Job fetched successfully:', jobData);
        setJob(jobData);

        // Check if user already applied
        if (user?.role === 'student') {
          const { data: applications } = await getMyApplications();
          const alreadyApplied = applications.some(app => app.job === jobId);
          setHasApplied(alreadyApplied);
        }
      } catch (err) {
        console.error('Error fetching job:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load job details.');
      }
      setLoading(false);
    };

    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId, user]);

  const handleApply = async () => {
    try {
      setApplying(true);
      // Open a modal or form for cover letter
      navigate(`/application/apply/${jobId}`);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Failed to apply.');
    }
    setApplying(false);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button onClick={() => navigate('/dashboard')}>Back to Jobs</Button>
      </Container>
    );
  }

  if (!job) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning">Job not found.</Alert>
        <Button onClick={() => navigate('/dashboard')}>Back to Jobs</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        {/* Job Title Section */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
            {job.title}
          </Typography>
          <Typography variant="h6" color="textSecondary" gutterBottom>
            {job.company}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Key Information */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <Stack direction="row" spacing={1} alignItems="center">
              <LocationOn color="primary" />
              <Typography variant="body2">
                <strong>Location:</strong> {job.location || 'Not specified'}
              </Typography>
            </Stack>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Work color="primary" />
              <Typography variant="body2">
                <strong>Job Type:</strong> {job.jobType || 'Not specified'}
              </Typography>
            </Stack>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Stack direction="row" spacing={1} alignItems="center">
              <School color="primary" />
              <Typography variant="body2">
                <strong>Salary:</strong> {job.salary || 'Competitive'}
              </Typography>
            </Stack>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Business color="primary" />
              <Typography variant="body2">
                <strong>CTC:</strong> {job.ctc || 'Not specified'}
              </Typography>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Job Description */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Job Description
          </Typography>
          <Typography
            variant="body2"
            sx={{
              whiteSpace: 'pre-wrap',
              p: 2,
              bgcolor: 'grey.50',
              borderRadius: 1,
              fontFamily: 'monospace'
            }}
          >
            {job.description}
          </Typography>
        </Box>

        {/* Requirements */}
        {job.requirements && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Requirements
            </Typography>
            <Typography
              variant="body2"
              sx={{
                whiteSpace: 'pre-wrap',
                p: 2,
                bgcolor: 'grey.50',
                borderRadius: 1
              }}
            >
              {job.requirements}
            </Typography>
          </Box>
        )}

        {/* Screening Steps */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Screening Process
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            {job.quiz && (
              <Chip label="MCQ Quiz" color="primary" variant="outlined" />
            )}
            {job.task && (
              <Chip label="Coding Task" color="primary" variant="outlined" />
            )}
            {!job.quiz && !job.task && (
              <Typography variant="body2" color="textSecondary">
                No screening assessments required.
              </Typography>
            )}
          </Stack>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Action Buttons */}
        <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/dashboard')}
          >
            Back to Jobs
          </Button>
          {user?.role === 'student' && (
            <Button
              variant="contained"
              color="primary"
              onClick={handleApply}
              disabled={hasApplied || applying}
            >
              {applying ? <CircularProgress size={24} /> : (hasApplied ? 'Already Applied' : 'Apply Now')}
            </Button>
          )}
        </Stack>
      </Paper>
    </Container>
  );
};

export default JobDetailsPage;
