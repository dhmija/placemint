import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Box,
  Alert,
  Paper,
  Divider
} from '@mui/material';
import { FormControl, FormLabel, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { getJobById, createJob, updateJob } from '../services/api';
import { useAuth } from '../context/AuthContext';

const EditJobPage = () => {
  const { id } = useParams(); // Job ID
  const [job, setJob] = useState(null); // To store the full job object
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    description: '',
    salary: '',
    location: '',
    site: 'Onsite',
    jobType: 'Intern',
    salaryRange: 'Not Disclosed',
  });
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(!!id); // Only load if editing
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const dashboardUrl = user.role === 'recruiter' ? '/admin/dashboard' : '/tpo/dashboard';
  const quizUrl = user.role === 'recruiter' ? `/admin/job/${id}/quiz` : `/tpo/job/${id}/quiz`;
  const taskUrl = user.role === 'recruiter' ? `/admin/job/${id}/task` : `/tpo/job/${id}/task`;

  useEffect(() => {
    if (id) {
      const fetchJob = async () => {
        try {
          const { data } = await getJobById(id);
          setJob(data); // Save the full job data
          setFormData({
            title: data.title,
            company: data.company,
            description: data.description,
            salary: data.salary,
            location: data.location,
            site: data.site || 'Onsite',
            jobType: data.jobType || 'Intern',
            salaryRange: data.salaryRange || 'Not Disclosed',
          });
        } catch (err) {
          setError(err.response?.data?.message || 'Failed to load job data.');
        }
        setPageLoading(false);
      };
      fetchJob();
    }
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      if (id) {
        // We only send fields that can be updated here
        await updateJob(id, formData);
        setSuccess('Job updated successfully!');
      } else {
        const { data: newJob } = await createJob(formData);
        setSuccess('Job created successfully! You can now add a quiz or task.');
        // Redirect to edit page so they can add a quiz/task
        navigate(user.role === 'recruiter' ? `/admin/job/edit/${newJob._id}` : `/tpo/job/edit/${newJob._id}`);
      }
      
      // Redirect back to the correct dashboard after a delay
      setTimeout(() => {
        if (!id) navigate(dashboardUrl);
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save job.');
    }
    setLoading(false);
  };

  if (pageLoading) {
    return <Box display="flex" justifyContent="center" mt={5}><CircularProgress /></Box>;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }} component="form" onSubmit={handleSubmit}>
        <Typography variant="h4" gutterBottom>
          {id ? 'Edit Job' : 'Create New Job'}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              name="title"
              label="Job Title"
              value={formData.title}
              onChange={handleChange}
              required
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="company"
              label="Company Name"
              value={formData.company}
              onChange={handleChange}
              required
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="location"
              label="Location (e.g., Remote, New York)"
              value={formData.location}
              onChange={handleChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="salary"
              label="Salary (e.g., $100,000/year, Not Disclosed)"
              value={formData.salary}
              onChange={handleChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Job Site</FormLabel>
              <RadioGroup
                name="site"
                value={formData.site}
                onChange={handleChange}
              >
                <FormControlLabel value="All" control={<Radio />} label="All" />
                <FormControlLabel value="Online" control={<Radio />} label="Online" />
                <FormControlLabel value="Onsite" control={<Radio />} label="On-site" />
                <FormControlLabel value="Hybrid" control={<Radio />} label="Hybrid" />
              </RadioGroup>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Job Type</FormLabel>
              <RadioGroup
                name="jobType"
                value={formData.jobType}
                onChange={handleChange}
              >
                <FormControlLabel value="Intern" control={<Radio />} label="Intern" />
                <FormControlLabel value="Full Time" control={<Radio />} label="Full Time" />
                <FormControlLabel value="Part Time" control={<Radio />} label="Part Time" />
                <FormControlLabel value="Contract" control={<Radio />} label="Contract" />
              </RadioGroup>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Salary Range</FormLabel>
              <RadioGroup
                name="salaryRange"
                value={formData.salaryRange}
                onChange={handleChange}
              >
                <FormControlLabel value="Paid" control={<Radio />} label="Paid" />
                <FormControlLabel value="Unpaid" control={<Radio />} label="Unpaid" />
                <FormControlLabel value="Not Disclosed" control={<Radio />} label="Not Disclosed" />
              </RadioGroup>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="description"
              label="Job Description"
              value={formData.description}
              onChange={handleChange}
              required
              fullWidth
              multiline
              rows={10}
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              fullWidth
              sx={{ py: 1.5 }}
            >
              {loading ? <CircularProgress size={24} /> : (id ? 'Save Changes' : 'Create Job')}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* --- NEW QUIZ & TASK SECTION --- */}
      {id && (
        <Paper sx={{ p: 4, mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            Screening Steps
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            {/* Quiz Box */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6">MCQ Quiz</Typography>
              <Typography variant="body2" sx={{ mb: 2, minHeight: 40 }}>
                {job?.quiz ? "This job has an associated quiz." : "No quiz attached."}
              </Typography>
              <Button
                component={RouterLink}
                to={quizUrl}
                variant="outlined"
                color="secondary"
              >
                {job?.quiz ? "Edit Quiz" : "Create Quiz"}
              </Button>
            </Grid>
            {/* Task Box */}
            <Grid item xs={12} md={6}>
              <Typography variant="h6">Coding Task</Typography>
              <Typography variant="body2" sx={{ mb: 2, minHeight: 40 }}>
                {job?.task ? "This job has an associated task." : "No coding task attached."}
              </Typography>
              <Button
                component={RouterLink}
                to={taskUrl}
                variant="outlined"
                color="secondary"
              >
                {job?.task ? "Edit Task" : "Create Task"}
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Container>
  );
};

export default EditJobPage;