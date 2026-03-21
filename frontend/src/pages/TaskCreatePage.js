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
  IconButton,
  Divider,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tooltip,
  Switch,
  FormControlLabel
} from '@mui/material';
import { AddCircle, Delete, Save } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { getJobById, createTask, updateJob } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Judge0 Language IDs
const languageOptions = [
  { id: 54, name: "C++ (GCC 9.2.0)" },
  { id: 62, name: "Java (OpenJDK 13.0.1)" },
  { id: 71, name: "Python (3.8.1)" },
  { id: 63, name: "JavaScript (Node.js 12.14.0)" },
  { id: 50, name: "C (GCC 9.2.0)" },
];

const TaskCreatePage = () => {
  const { id } = useParams(); // Job ID
  const [job, setJob] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    languageId: 71, // Default to Python
    starterCode: '',
  });
  const [testCases, setTestCases] = useState([
    { input: '', expectedOutput: '', hidden: false }
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const editJobUrl = user?.role === 'recruiter' ? `/admin/job/edit/${id}` : `/tpo/job/edit/${id}`;

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        console.log('Fetching job with ID:', id);
        const { data: jobData } = await getJobById(id);
        console.log('Job fetched successfully:', jobData);
        setJob(jobData);
        
        if (jobData.task) {
           setError("Editing existing tasks is not supported yet. To create a new task, first remove the link from the job.");
        } else {
          setFormData(prev => ({ ...prev, title: `Coding Task for ${jobData.title}`}));
        }
      } catch (err) {
        console.error('Error fetching job:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load job data.');
      }
      setLoading(false);
    };
    
    if (id) {
      fetchJob();
    }
  }, [id]);

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleTestCaseChange = (index, field, value) => {
    const newTestCases = [...testCases];
    newTestCases[index][field] = value;
    setTestCases(newTestCases);
  };
  
  const addTestCase = () => {
    setTestCases([...testCases, { input: '', expectedOutput: '', hidden: true }]);
  };
  
  const removeTestCase = (index) => {
    setTestCases(testCases.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // 1. Create the Task
      const taskData = { ...formData, job: id, testCases };
      const { data: newTask } = await createTask(taskData);

      // 2. Link the Task ID back to the Job
      await updateJob(id, { ...job, task: newTask._id });
      
      setSuccess('Task created and linked to job successfully!');
      setTimeout(() => navigate(editJobUrl), 2000);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task.');
    }
    setLoading(false);
  };

  if (loading && !job && !error) {
    return <Box display="flex" justifyContent="center" mt={5}><CircularProgress /></Box>;
  }
  
  if (error && !job) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button onClick={() => navigate(editJobUrl)} sx={{ mt: 2 }}>Back to Job</Button>
      </Container>
    );
  }
  
  if (job?.task) {
     return (
       <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
         <Alert severity="info">
           This job already has a coding task. To create a new one, please create a new job.
         </Alert>
         <Button onClick={() => navigate(editJobUrl)} sx={{ mt: 2 }}>Back to Job</Button>
       </Container>
     )
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }} component="form" onSubmit={handleSubmit}>
        <Typography variant="h4" gutterBottom>
          Create Coding Task for {job?.title}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Grid container spacing={2}>
          <Grid item xs={12} sm={8}>
            <TextField
              name="title"
              label="Task Title"
              value={formData.title}
              onChange={handleFormChange}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel id="lang-select-label">Language</InputLabel>
              <Select
                name="languageId"
                labelId="lang-select-label"
                label="Language"
                value={formData.languageId}
                onChange={handleFormChange}
              >
                {languageOptions.map(lang => (
                  <MenuItem key={lang.id} value={lang.id}>{lang.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="description"
              label="Problem Description (Markdown is not supported)"
              value={formData.description}
              onChange={handleFormChange}
              fullWidth
              required
              multiline
              rows={8}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="starterCode"
              label="Boilerplate/Starter Code (Optional)"
              value={formData.starterCode}
              onChange={handleFormChange}
              fullWidth
              multiline
              rows={6}
              InputProps={{
                style: { fontFamily: 'monospace' }
              }}
            />
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        <Typography variant="h5" gutterBottom>Test Cases</Typography>
        
        {testCases.map((tc, index) => (
          <Paper key={index} sx={{ mb: 2, p: 2, border: '1px solid #ddd' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Test Case {index + 1}</Typography>
              <Tooltip title={tc.hidden ? "This is a HIDDEN test case" : "This is a PUBLIC example"}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={tc.hidden}
                      onChange={(e) => handleTestCaseChange(index, 'hidden', e.target.checked)}
                    />
                  }
                  label="Hidden"
                />
              </Tooltip>
              <IconButton onClick={() => removeTestCase(index)} color="error" disabled={testCases.length <= 1}>
                <Delete />
              </IconButton>
            </Box>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Input (stdin)"
                  value={tc.input}
                  onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                  fullWidth
                  required
                  multiline
                  rows={3}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Expected Output (stdout)"
                  value={tc.expectedOutput}
                  onChange={(e) => handleTestCaseChange(index, 'expectedOutput', e.target.value)}
                  fullWidth
                  required
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </Paper>
        ))}

        <Button
          onClick={addTestCase}
          startIcon={<AddCircle />}
          variant="outlined"
          sx={{ mr: 2 }}
        >
          Add Test Case
        </Button>
        <Button
          type="submit"
          startIcon={<Save />}
          variant="contained"
          color="primary"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Save Task'}
        </Button>
      </Paper>
    </Container>
  );
};

export default TaskCreatePage;