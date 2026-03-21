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
  Chip
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { getTaskResults, getMyProfile } from '../services/api'; // We need profile for names
import { useAuth } from '../context/AuthContext';

const TaskScoreboardPage = () => {
  const { id } = useParams(); // Job ID
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const applicationUrl = (appId) => user.role === 'recruiter' ? `/admin/application/${appId}` : `/tpo/application/${appId}`;

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        const { data } = await getTaskResults(id);
        
        // This is a simple version. A more robust version would
        // call the profile-service to get names for each student ID
        setSubmissions(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load task results.');
      }
      setLoading(false);
    };
    fetchResults();
  }, [id]);

  if (loading) {
    return <Box display="flex" justifyContent="center" mt={5}><CircularProgress /></Box>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Coding Task Results
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {submissions.length === 0 ? (
        <Typography>No students have submitted a solution for this task yet.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Student ID</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Submitted On</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {submissions.map((entry) => (
                <TableRow hover key={entry._id}>
                  <TableCell>
                    {/* In a real app, we'd fetch the student's name */}
                    {entry.student}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={entry.status} 
                      color={entry.status === 'Passed' ? 'success' : 'error'}
                    />
                  </TableCell>
                  <TableCell>{new Date(entry.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default TaskScoreboardPage;