import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuizForJob, submitQuiz } from '../services/api';

const QuizTakePage = () => {
  const { jobId } = useParams(); // Job ID
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const { data } = await getQuizForJob(jobId);
        setQuiz(data);
        setAnswers(new Array(data.questions.length).fill(null));
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load quiz.');
      }
      setLoading(false);
    };
    fetchQuiz();
  }, [jobId]);

  const handleAnswerChange = (questionIndex, answerIndex) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (answers.some(a => a === null)) {
      setError('Please answer all questions.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const { data } = await submitQuiz(jobId, answers);
      setResult(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit quiz.');
    }
    setSubmitting(false);
  };

  if (loading) {
    return <Box display="flex" justifyContent="center" mt={5}><CircularProgress /></Box>;
  }

  if (error && !quiz) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
        <Button onClick={() => navigate(`/job/${jobId}`)} sx={{ mt: 2 }}>Back to Job</Button>
      </Container>
    );
  }

  if (result) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>Quiz Submitted!</Typography>
          <Typography variant="h5" gutterBottom>
            Your Score: {result.score} / {result.totalQuestions}
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
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }} component="form" onSubmit={handleSubmit}>
        <Typography variant="h4" gutterBottom>{quiz?.title}</Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Answer all questions to the best of your ability. This can only be submitted once.
        </Typography>

        {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}

        {quiz?.questions.map((q, qIndex) => (
          <FormControl key={q._id} component="fieldset" margin="normal" fullWidth>
            <FormLabel component="legend" sx={{ fontSize: '1.2rem', mb: 1 }}>
              {qIndex + 1}. {q.question}
            </FormLabel>
            <RadioGroup
              value={answers[qIndex]}
              onChange={(e) => handleAnswerChange(qIndex, parseInt(e.target.value))}
            >
              {q.options.map((option, oIndex) => (
                <FormControlLabel 
                  key={oIndex} 
                  value={oIndex} 
                  control={<Radio />} 
                  label={option} 
                />
              ))}
            </RadioGroup>
          </FormControl>
        ))}

        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          disabled={submitting}
          sx={{ mt: 3 }}
        >
          {submitting ? <CircularProgress size={24} /> : 'Submit Quiz'}
        </Button>
      </Paper>
    </Container>
  );
};

export default QuizTakePage;