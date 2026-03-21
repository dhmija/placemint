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
  Link,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { getQuizResults, getSubmissionDetails } from '../services/api';
import { useAuth } from '../context/AuthContext';

const QuizScoreboardPage = () => {
  const { id } = useParams(); // Job ID
  const [scoreboard, setScoreboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Get the correct URL prefix based on role
  const applicationUrl = (appId) => user.role === 'recruiter' ? `/admin/application/${appId}` : `/tpo/application/${appId}`;

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const { data } = await getQuizResults(id);
        setScoreboard(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load scoreboard.');
      }
      setLoading(false);
    };
    fetchResults();
  }, [id]);

  // --- NEW ---
  // This function fulfills your "click name to see application" request
  const handleStudentClick = async (submissionId) => {
    try {
      // 1. Get the submission details (which includes the application object)
      const { data } = await getSubmissionDetails(submissionId);
      
      if (data.application && data.application._id) {
        // 2. If an application ID exists, go to that applicant's page
        navigate(applicationUrl(data.application._id));
      } else {
        // No application yet
        alert(`${data.studentProfile.name} has not submitted their application yet.`);
      }
    } catch (err) {
      alert('Could not find application details.');
    }
  };


  if (loading) {
    return <Box display="flex" justifyContent="center" mt={5}><CircularProgress /></Box>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Quiz Scoreboard
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {scoreboard.length === 0 ? (
        <Typography>No students have taken this quiz yet.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Rank</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Enrollment No.</TableCell>
                <TableCell>Score</TableCell>
                <TableCell>Submitted On</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {scoreboard.map((entry, index) => (
                <TableRow hover key={entry.submissionId}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <Link
                      component="button"
                      variant="body2"
                      onClick={() => handleStudentClick(entry.submissionId)}
                    >
                      {entry.studentName}
                    </Link>
                  </TableCell>
                  <TableCell>{entry.enrollmentNumber}</TableCell>
                  <TableCell>
                    <Typography fontWeight="bold">
                      {entry.score} / {entry.totalQuestions}
                    </Typography>
                  </TableCell>
                  <TableCell>{new Date(entry.submittedAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default QuizScoreboardPage;