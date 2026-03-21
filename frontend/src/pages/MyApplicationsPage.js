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
  Chip
} from '@mui/material';
import { getMyApplications } from '../services/api';
import { Link as RouterLink } from 'react-router-dom';

const getStatusColor = (status) => {
  switch (status) {
    case 'Applied': return 'default';
    case 'Viewed': return 'info';
    case 'Shortlisted': return 'primary';
    case 'Waitlisted': return 'warning';
    case 'Hired': return 'success';
    case 'Rejected': return 'error';
    default: return 'default';
  }
};

const MyApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);
        const { data } = await getMyApplications();
        setApplications(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load applications.');
      }
      setLoading(false);
    };
    fetchApplications();
  }, []);

  if (loading) {
    return <Box display="flex" justifyContent="center" mt={5}><CircularProgress /></Box>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        My Applications
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {applications.length === 0 ? (
        <Typography>You have not applied to any jobs yet.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Company</TableCell>
                <TableCell>Job Title</TableCell>
                <TableCell>Applied On</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {applications.map((app) => (
                <TableRow hover key={app._id}
                  component={RouterLink}
                  to={`/job/${app.job}`}
                  sx={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <TableCell>{app.jobDetails?.company || 'N/A'}</TableCell>
                  <TableCell>{app.jobDetails?.title || 'Job not found'}</TableCell>
                  <TableCell>{new Date(app.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip label={app.status} color={getStatusColor(app.status)} size="small" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Container>
  );
};

export default MyApplicationsPage;