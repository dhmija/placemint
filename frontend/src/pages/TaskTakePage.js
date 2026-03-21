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
  Chip,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { getTaskForJob, submitTask } from '../services/api';
import Editor from 'react-simple-code-editor';
import prism from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';

// Map Judge0 IDs to prism languages
const languageMap = {
  71: 'python',
  62: 'java',
  54: 'cpp',
  50: 'c',
  63: 'javascript',
};

const TaskTakePage = () => {
  const { jobId } = useParams(); // Job ID
  const [task, setTask] = useState(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTask = async () => {
      try {
        setLoading(true);
        const { data } = await getTaskForJob(jobId);
        setTask(data);
        setCode(data.starterCode || '');
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load task.');
      }
      setLoading(false);
    };
    fetchTask();
  }, [jobId]);

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      const { data } = await submitTask(jobId, code, task.languageId);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit task.');
    }
    setSubmitting(false);
  };

  const getLanguage = () => languageMap[task.languageId] || 'clike';

  if (loading) {
    return <Box display="flex" justifyContent="center" mt={5}><CircularProgress /></Box>;
  }

  if (error && !task) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={() => navigate(`/job/${jobId}`)} sx={{ mt: 2 }}>Back to Job</Button>
      </Container>
    );
  }
  
  if (result) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>Task Submitted!</Typography>
          <Typography variant="h5" gutterBottom>
            Status: <Chip label={result.status} color={result.status === 'Passed' ? 'success' : 'error'} />
          </Typography>
          <Typography color="text.secondary">
            You can now return to the job page to complete your application.
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => navigate(`/job/${jobId}`)} 
            sx={{ mt: 3 }}
          >
            Back to Job Details
          </Button>
          
          <Box sx={{ mt: 3, textAlign: 'left' }}>
            <Typography variant="h6">Test Case Results:</Typography>
            {result.results.map((res, i) => (
              <Alert key={i} severity={res.passed ? 'success' : 'error'} sx={{ mb: 1 }}>
                Test Case {i+1}: {res.status}
              </Alert>
            ))}
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>{task?.title}</Typography>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6">Problem Description</Typography>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>
          {task?.description}
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Typography variant="h6">Example Test Cases</Typography>
        {task?.testCases.map((tc, i) => (
          <Box key={i} sx={{ mt: 1, p: 1, bgcolor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="body2"><strong>Input:</strong> {tc.input}</Typography>
            <Typography variant="body2"><strong>Expected Output:</strong> {tc.expectedOutput}</Typography>
          </Box>
        ))}
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Your Solution</Typography>
        <Box sx={{ border: '1px solid #ddd', borderRadius: 1, overflow: 'hidden' }}>
          <Editor
            value={code}
            onValueChange={c => setCode(c)}
            highlight={code => prism.highlight(code, prism.languages[getLanguage()], getLanguage())}
            padding={10}
            style={{
              fontFamily: '"Fira code", "Fira Mono", monospace',
              fontSize: 14,
              minHeight: 300,
              backgroundColor: '#fdfdfd'
            }}
          />
        </Box>
        {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}
        <Button
          variant="contained"
          color="primary"
          size="large"
          disabled={submitting}
          onClick={handleSubmit}
          sx={{ mt: 3 }}
        >
          {submitting ? <CircularProgress size={24} /> : 'Submit Code'}
        </Button>
      </Paper>
    </Container>
  );
};

export default TaskTakePage;