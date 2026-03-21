import React, { useState, useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import SendIcon from '@mui/icons-material/Send';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import { startInterview, submitInterviewAnswer, endInterview } from '../services/api';
import './MockInterviewPage.css';

const MockInterviewPage = () => {
  const { topic } = useParams();
  const navigate = useNavigate();

  const [interviewId, setInterviewId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [startTime, setStartTime] = useState(null);
  const [duration, setDuration] = useState(0);
  const [openEndDialog, setOpenEndDialog] = useState(false);
  const messagesEndRef = useRef(null);

  // Timer for interview duration
  useEffect(() => {
    let interval;
    if (startTime && interviewId) {
      interval = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [startTime, interviewId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize interview
  useEffect(() => {
    const initializeInterview = async () => {
      try {
        setLoading(true);
        // Map URL topic slug to canonical topic string expected by backend
        const mapTopic = (t) => {
          if (!t) return t;
          const slug = t.replace(/_/g, '-').toLowerCase();
          const map = {
            'ai-engineer': 'AI Engineer',
            'machine-learning-engineer': 'Machine Learning Engineer',
            'ios-developer': 'iOS Developer',
            'blockchain-engineer': 'Blockchain Engineer',
          };
          return map[slug] || t;
        };

        const canonicalTopic = mapTopic(topic);
        const { data } = await startInterview(canonicalTopic);
        setInterviewId(data.interviewId);
        setMessages([{ role: 'model', text: data.message }]);
        setStartTime(Date.now());
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to start interview. Please try again.');
        console.error('Error starting interview:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeInterview();
  }, [topic]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!userInput.trim() || !interviewId) return;

    const userMessage = userInput.trim();

    try {
      setSubmitting(true);
      setError('');

      // Add user message to UI
      setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
      setUserInput('');

      // Submit to backend
      const { data } = await submitInterviewAnswer(interviewId, userMessage);

      // Add AI response to UI
      setMessages(prev => [...prev, { role: 'model', text: data.message }]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit answer. Please try again.');
      console.error('Error submitting answer:', err);
      // Remove the user message if there was an error
      setMessages(prev => prev.slice(0, -1));
      setUserInput(userMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndInterview = async () => {
    try {
      await endInterview(interviewId);
      setOpenEndDialog(false);
      navigate(`/interview-history`, { state: { focusInterviewId: interviewId, justCompleted: true } });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to end interview.');
      console.error('Error ending interview:', err);
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 3, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            Mock Interview: {topic}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Google • Technical Interview
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Chip label={`Duration: ${formatTime(duration)}`} color="primary" />
          <Button
            variant="outlined"
            color="error"
            startIcon={<ExitToAppIcon />}
            onClick={() => setOpenEndDialog(true)}
            sx={{ ml: 2 }}
          >
            End Interview
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>{error}</Alert>}

      {/* Messages Container */}
      <Paper
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          mb: 2,
          backgroundColor: '#f5f5f5',
          borderRadius: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {messages.map((msg, idx) => (
          <Box
            key={idx}
            sx={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              mb: 1,
            }}
          >
            <Paper
              sx={{
                maxWidth: '70%',
                p: 2,
                backgroundColor: msg.role === 'user' ? '#007bff' : '#e9ecef',
                color: msg.role === 'user' ? 'white' : 'black',
                borderRadius: 2,
                wordWrap: 'break-word',
              }}
            >
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {msg.text}
              </Typography>
              <Typography variant="caption" sx={{ mt: 1, display: 'block', opacity: 0.7 }}>
                {msg.role === 'user' ? 'You' : 'Interviewer'}
              </Typography>
            </Paper>
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Paper>

      {/* Input Form */}
      <Box component="form" onSubmit={handleSendMessage} sx={{ display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          placeholder="Type your answer here..."
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          disabled={submitting}
          multiline
          maxRows={4}
          minRows={2}
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          endIcon={<SendIcon />}
          disabled={submitting || !userInput.trim()}
          sx={{ alignSelf: 'flex-end' }}
        >
          {submitting ? 'Sending...' : 'Send'}
        </Button>
      </Box>

      {/* End Interview Dialog */}
      <Dialog open={openEndDialog} onClose={() => setOpenEndDialog(false)}>
        <DialogTitle>End Interview</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to end this interview? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEndDialog(false)}>Cancel</Button>
          <Button onClick={handleEndInterview} variant="contained" color="error">
            End Interview
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MockInterviewPage;
