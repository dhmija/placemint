import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  TextField,
  Button,
  Divider,
  Grid,
  Card,
  CardContent,
  Stack,
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Chip } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { getJobById, applyToJob, getMyResult, getMyTaskResult } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ArrowBack, Send, CheckCircle, School, Code } from '@mui/icons-material';

const JobApplicationFormPage = () => {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [taskCompleted, setTaskCompleted] = useState(false);
  const [quizDialog, setQuizDialog] = useState(false);
  const [taskDialog, setTaskDialog] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const steps = [];
  if (job?.quiz) steps.push('Complete MCQ Quiz');
  if (job?.task) steps.push('Complete Coding Task');
  steps.push('Submit Application');

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        console.log('Fetching job with ID:', jobId);
        const { data: jobData } = await getJobById(jobId);
        console.log('Job fetched successfully:', jobData);
        setJob(jobData);
      } catch (err) {
        console.error('Error fetching job:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load job details.');
      }
      setLoading(false);
    };

    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId]);

  // After job is loaded, check whether the student has already completed the
  // quiz/task for this job so we can enable submission.
  useEffect(() => {
    const checkAssessments = async () => {
      if (!job) return;

      if (job.quiz) {
        try {
          await getMyResult(jobId);
          setQuizCompleted(true);
        } catch (err) {
          // No result found or error -> quiz not completed
          setQuizCompleted(false);
        }
      }

      if (job.task) {
        try {
          await getMyTaskResult(jobId);
          setTaskCompleted(true);
        } catch (err) {
          // No result found or error -> task not completed
          setTaskCompleted(false);
        }
      }
    };

    checkAssessments();
  }, [job, jobId]);

  const handleQuizClick = () => {
    setQuizDialog(true);
  };

  const handleTaskClick = () => {
    setTaskDialog(true);
  };

  const handleStartQuiz = () => {
    navigate(`/quizzes/take/${jobId}`);
  };

  const handleStartTask = () => {
    navigate(`/tasks/take/${jobId}`);
  };

  const handleNextStep = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handlePreviousStep = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if all assessments are completed
    if (job?.quiz && !quizCompleted) {
      setError('Please complete the MCQ Quiz before submitting.');
      return;
    }
    if (job?.task && !taskCompleted) {
      setError('Please complete the Coding Task before submitting.');
      return;
    }
    if (!coverLetter.trim()) {
      setError('Please write a cover letter.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      console.log('Applying to job:', jobId);
      const { data } = await applyToJob(jobId, coverLetter);
      console.log('Application submitted successfully:', data);
      setSuccess('Application submitted successfully!');
      
      setTimeout(() => {
        navigate('/my-applications');
      }, 2000);
    } catch (err) {
      console.error('Error applying to job:', err);
      setError(err.response?.data?.message || err.message || 'Failed to submit application.');
    }
    setSubmitting(false);
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

  if (error && !job) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button 
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
      </Container>
    );
  }

  if (!job) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="warning">Job not found.</Alert>
        <Button 
          startIcon={<ArrowBack />}
          onClick={() => navigate(-1)}
        >
          Go Back
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Job Summary */}
        <Grid item xs={12} md={4}>
          <Card sx={{ position: 'sticky', top: 20 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                Job Summary
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Position
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {job.title}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Company
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {job.company}
                </Typography>
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Location
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {job.location || 'Not specified'}
                </Typography>
              </Box>

              {job.salary && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Salary
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {job.salary}
                  </Typography>
                </Box>
              )}

              {job.ctc && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    CTC
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {job.ctc}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Application Form */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
              Submit Your Application
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <form onSubmit={handleSubmit}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  <strong>Applicant Email:</strong> {user?.email}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  <strong>Position:</strong> {job.title}
                </Typography>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Screening Assessments */}
              {(job?.quiz || job?.task) && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                    Screening Assessments
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    Please complete the following assessments before submitting your application:
                  </Typography>
                  <Stack spacing={2} sx={{ mb: 3 }}>
                    {job?.quiz && (
                      <Card variant="outlined" sx={{ p: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              MCQ Quiz
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Multiple choice questions assessment
                            </Typography>
                          </Box>
                          {quizCompleted ? (
                            <Chip label="✓ Completed" color="success" variant="filled" />
                          ) : (
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              onClick={handleStartQuiz}
                            >
                              Start Quiz
                            </Button>
                          )}
                        </Stack>
                      </Card>
                    )}
                    {job?.task && (
                      <Card variant="outlined" sx={{ p: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              Coding Task
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Programming problem to solve
                            </Typography>
                          </Box>
                          {taskCompleted ? (
                            <Chip label="✓ Completed" color="success" variant="filled" />
                          ) : (
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              onClick={handleStartTask}
                            >
                              Start Task
                            </Button>
                          )}
                        </Stack>
                      </Card>
                    )}
                  </Stack>
                </Box>
              )}

              <Divider sx={{ my: 3 }} />

              <Box sx={{ mb: 3 }}>
                <TextField
                  label="Cover Letter"
                  placeholder="Tell us why you're interested in this position and how your skills match the requirements..."
                  multiline
                  rows={10}
                  fullWidth
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  required
                  variant="outlined"
                  helperText="Minimum 50 characters recommended"
                />
              </Box>

              <Stack direction="row" spacing={2} sx={{ justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<ArrowBack />}
                  onClick={() => navigate(-1)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={<Send />}
                  disabled={submitting || !coverLetter.trim()}
                >
                  {submitting ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </Button>
              </Stack>
            </form>
            {/* If we could not verify completion but job requires assessments, warn the user */}
            {(job?.quiz && !quizCompleted) || (job?.task && !taskCompleted) ? (
              <Alert severity="info" sx={{ mt: 2 }}>
                We couldn't verify your assessment completion from the frontend. If you've already
                completed the quiz/task, you can still submit — the backend will accept the
                application and relies on server-side records.
              </Alert>
            ) : (
              <Alert severity="info" sx={{ mt: 3 }}>
                By submitting this application, you agree to the screening process which may include a quiz and/or coding task.
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default JobApplicationFormPage;
