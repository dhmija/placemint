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
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
} from '@mui/material';
import { AddCircle, Delete, Save } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { getJobById, createQuiz, updateJob, getQuizForJob } from '../services/api';
import { useAuth } from '../context/AuthContext';

const QuizCreatePage = () => {
  const { id } = useParams(); // Job ID
  const [job, setJob] = useState(null);
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState([
    { question: '', options: ['', '', '', ''], correctAnswer: 0 },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const dashboardUrl = user?.role === 'recruiter' ? '/admin/dashboard' : '/tpo/dashboard';
  const editJobUrl = user?.role === 'recruiter' ? `/admin/job/edit/${id}` : `/tpo/job/edit/${id}`;


  useEffect(() => {
    const fetchJobAndQuiz = async () => {
      try {
        setLoading(true);
        console.log('Fetching job with ID:', id);
        const { data: jobData } = await getJobById(id);
        console.log('Job fetched successfully:', jobData);
        setJob(jobData);

        if (jobData.quiz) {
          // If quiz exists, fetch it to populate the form
          const { data: quizData } = await getQuizForJob(id); // This will have answers hidden
          // We need a new route to get quiz *with* answers for editing
          // For now, let's just populate the title
          setTitle(quizData.title);
          // setQuestions(quizData.questions); // This won't have correct answers
          setError("Editing existing quizzes is not fully supported yet. To create a new quiz, first remove the link from the job.");
        } else {
          setTitle(`Quiz for ${jobData.title}`);
        }

      } catch (err) {
        console.error('Error fetching job:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load job data.');
      }
      setLoading(false);
    };
    
    if (id) {
      fetchJobAndQuiz();
    }
  }, [id]);

  const handleQuestionChange = (qIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].question = value;
    setQuestions(newQuestions);
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const handleCorrectAnswerChange = (qIndex, oIndex) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].correctAnswer = oIndex;
    setQuestions(newQuestions);
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { question: '', options: ['', '', '', ''], correctAnswer: 0 },
    ]);
  };

  const removeQuestion = (qIndex) => {
    const newQuestions = questions.filter((_, index) => index !== qIndex);
    setQuestions(newQuestions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // 1. Create the Quiz
      const quizData = { job: id, title, questions };
      const { data: newQuiz } = await createQuiz(quizData);

      // 2. Link the Quiz ID back to the Job
      await updateJob(id, { ...job, quiz: newQuiz._id });
      
      setSuccess('Quiz created and linked to job successfully!');
      setTimeout(() => navigate(editJobUrl), 2000);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create quiz.');
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
  
  // A simple block to prevent editing for now
  if (job?.quiz) {
     return (
       <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
         <Alert severity="info">
           This job already has a quiz. To create a new one, please create a new job.
           (Editing functionality is a future enhancement).
         </Alert>
         <Button onClick={() => navigate(editJobUrl)} sx={{ mt: 2 }}>Back to Job</Button>
       </Container>
     )
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }} component="form" onSubmit={handleSubmit}>
        <Typography variant="h4" gutterBottom>
          Create Quiz for {job?.title}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <TextField
          label="Quiz Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          fullWidth
          required
          sx={{ mb: 3 }}
        />

        {questions.map((q, qIndex) => (
          <Box key={qIndex} sx={{ mb: 3, p: 2, border: '1px solid #ddd', borderRadius: 2 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Question {qIndex + 1}</Typography>
              <IconButton onClick={() => removeQuestion(qIndex)} color="error" disabled={questions.length <= 1}>
                <Delete />
              </IconButton>
            </Box>
            <TextField
              label="Question Text"
              value={q.question}
              onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
              fullWidth
              required
              multiline
              sx={{ my: 1 }}
            />
            <RadioGroup
              value={q.correctAnswer}
              onChange={(e) => handleCorrectAnswerChange(qIndex, parseInt(e.target.value))}
            >
              {q.options.map((opt, oIndex) => (
                <Box key={oIndex} display="flex" alignItems="center">
                  <FormControlLabel
                    value={oIndex}
                    control={<Radio />}
                    label={`Correct Answer`}
                  />
                  <TextField
                    label={`Option ${oIndex + 1}`}
                    value={opt}
                    onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                    fullWidth
                    required
                    variant="standard"
                  />
                </Box>
              ))}
            </RadioGroup>
          </Box>
        ))}

        <Button
          onClick={addQuestion}
          startIcon={<AddCircle />}
          variant="outlined"
          sx={{ mr: 2 }}
        >
          Add Question
        </Button>
        <Button
          type="submit"
          startIcon={<Save />}
          variant="contained"
          color="primary"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Save Quiz'}
        </Button>
      </Paper>
    </Container>
  );
};

export default QuizCreatePage;