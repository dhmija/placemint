import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Card,
  CardContent,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import ViewIcon from '@mui/icons-material/Visibility';
import { getStudentInterviews, getInterview } from '../services/api';

const InterviewHistoryPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        setLoading(true);
        const { data } = await getStudentInterviews();
        setInterviews(data);
        setError('');

        // If just completed, auto-open the details for the most recent interview
        if (location.state?.justCompleted && data.length > 0) {
          setJustCompleted(true);
          await handleViewDetailsAsync(data[0]._id);
        }
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to fetch interview history.');
        console.error('Error fetching interviews:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInterviews();
  }, []);

  const handleViewDetailsAsync = async (interviewId) => {
    try {
      const { data } = await getInterview(interviewId);
      setSelectedInterview(data);
      setOpenDialog(true);
    } catch (err) {
      setError('Failed to fetch interview details.');
      console.error('Error fetching interview:', err);
    }
  };

  const handleViewDetails = (interviewId) => {
    handleViewDetailsAsync(interviewId);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedInterview(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'ongoing':
        return 'info';
      case 'abandoned':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
          Interview History
        </Typography>
        <Typography variant="body1" color="textSecondary">
          View your past mock interviews and detailed feedback.
        </Typography>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Success Banner for Just Completed */}
      {justCompleted && (
        <Alert severity="success" sx={{ mb: 3 }}>
          ✅ Interview completed! Your results are shown below.
        </Alert>
      )}

      {/* Empty State */}
      {interviews.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="textSecondary">
            No interviews yet.
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Start a mock interview to practice for your interviews.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            onClick={() => navigate('/student-dashboard')}
          >
            Back to Dashboard
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Topic</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Company</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Duration</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="center">
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {interviews.map((interview) => (
                <TableRow
                  key={interview._id}
                  sx={{
                    '&:hover': {
                      backgroundColor: '#fafafa',
                    },
                  }}
                >
                  <TableCell>{interview.topic}</TableCell>
                  <TableCell>{interview.company}</TableCell>
                  <TableCell>
                    <Chip
                      label={interview.status}
                      color={getStatusColor(interview.status)}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{formatDuration(interview.duration)}</TableCell>
                  <TableCell>{formatDate(interview.createdAt)}</TableCell>
                  <TableCell align="center">
                    <Button
                      startIcon={<ViewIcon />}
                      size="small"
                      variant="outlined"
                      onClick={() => handleViewDetails(interview._id)}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Interview Details Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
          Interview Details: {selectedInterview?.topic}
        </DialogTitle>
        <DialogContent sx={{ py: 3 }}>
          {selectedInterview && (
            <Box>
              {/* Metadata */}
              <Box sx={{ mb: 3, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" variant="body2">
                      Company
                    </Typography>
                    <Typography variant="h6">{selectedInterview.company}</Typography>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" variant="body2">
                      Duration
                    </Typography>
                    <Typography variant="h6">
                      {formatDuration(selectedInterview.duration)}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>

              {/* Score & Feedback */}
              {selectedInterview.score !== undefined && (
                <Box sx={{ mb: 3 }}>
                  <Card>
                    <CardContent>
                      <Typography color="textSecondary" variant="body2" sx={{ mb: 1 }}>
                        Performance Score
                      </Typography>
                      <Typography
                        variant="h4"
                        sx={{
                          color:
                            selectedInterview.score >= 75
                              ? '#4caf50'
                              : selectedInterview.score >= 50
                              ? '#ff9800'
                              : '#f44336',
                        }}
                      >
                        {selectedInterview.score}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              )}

              {selectedInterview.feedback && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                    Feedback
                  </Typography>
                  <Paper sx={{ p: 2, backgroundColor: '#f9f9f9' }}>
                    <Typography variant="body2">{selectedInterview.feedback}</Typography>
                  </Paper>
                </Box>
              )}

              {/* Conversation History */}
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Conversation
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    maxHeight: '400px',
                    overflowY: 'auto',
                  }}
                >
                  {selectedInterview.history && selectedInterview.history.length > 0 ? (
                    selectedInterview.history.map((msg, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          display: 'flex',
                          justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <Paper
                          sx={{
                            p: 2,
                            maxWidth: '80%',
                            backgroundColor: msg.role === 'user' ? '#e3f2fd' : '#f5f5f5',
                            borderRadius: 2,
                          }}
                        >
                          <Typography variant="body2" sx={{ color: '#666' }}>
                            <strong>{msg.role === 'user' ? 'You' : 'Interviewer'}:</strong>
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {msg.parts && msg.parts[0]?.text
                              ? msg.parts[0].text
                              : JSON.stringify(msg)}
                          </Typography>
                        </Paper>
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      No conversation recorded.
                    </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default InterviewHistoryPage;
