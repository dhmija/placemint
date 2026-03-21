import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Button,
  Grid,
  Box,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getHackathonById, getUserHackathonRegistrations } from '../services/api';

const HackathonDetailsPage = () => {
  const { hackathonId } = useParams();
  const [hackathon, setHackathon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchHackathonDetails();
    checkRegistrationStatus();
  }, [hackathonId, user]);

  const checkRegistrationStatus = async () => {
    try {
      const response = await getUserHackathonRegistrations();
      const userRegistrations = response.data;
      
      // Check if user is registered for this hackathon
      // hackathon can be either a string ID or an object with _id
      const isRegistered = userRegistrations.some(reg => {
        const regHackathonId = typeof reg.hackathon === 'object' ? reg.hackathon._id : reg.hackathon;
        return regHackathonId === hackathonId;
      });
      
      console.log('Registration status check:', { hackathonId, isRegistered, userRegistrations });
      setIsAlreadyRegistered(isRegistered);
    } catch (err) {
      console.error('Failed to fetch registration status', err);
      setIsAlreadyRegistered(false);
    }
  };

  const fetchHackathonDetails = async () => {
    try {
      setLoading(true);
      const response = await getHackathonById(hackathonId);
      setHackathon(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch hackathon details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming':
        return 'info';
      case 'ongoing':
        return 'success';
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRegister = () => {
    navigate(`/hackathons/${hackathonId}/register`);
  };

  const isRegistrationOpen = hackathon && new Date() <= new Date(hackathon.registrationDeadline);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!hackathon) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">Hackathon not found</Alert>
        <Button onClick={() => navigate('/hackathons')} sx={{ mt: 2 }}>
          Back to Hackathons
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Button onClick={() => navigate('/hackathons')} sx={{ mb: 3 }}>
        ← Back to Hackathons
      </Button>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Card>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <Typography variant="h3" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
                {hackathon.title}
              </Typography>
              <Typography variant="h6" color="textSecondary">
                {hackathon.organization}
              </Typography>
            </div>
            <Chip 
              label={hackathon.status} 
              color={getStatusColor(hackathon.status)} 
              size="medium"
            />
          </Box>

          <Divider sx={{ my: 3 }} />

          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Overview
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {hackathon.description}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Event Details
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Start Date
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(hackathon.startDate)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      End Date
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(hackathon.endDate)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Location
                    </Typography>
                    <Typography variant="body1">
                      {hackathon.location}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Prize Pool
                    </Typography>
                    <Typography variant="body1">
                      {hackathon.prize}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Registration Info
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Registration Deadline
                    </Typography>
                    <Typography variant="body1">
                      {formatDate(hackathon.registrationDeadline)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Maximum Team Size
                    </Typography>
                    <Typography variant="body1">
                      {hackathon.maxTeamSize} members
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="textSecondary">
                      Total Registrations
                    </Typography>
                    <Typography variant="body1">
                      {hackathon.registrations ? hackathon.registrations.length : 0} teams
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {user?.role === 'student' && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                  {isAlreadyRegistered ? (
                    <Box>
                      <Typography variant="body2" color="success.main" sx={{ mb: 2 }}>
                        ✓ You have already registered for this hackathon
                      </Typography>
                      <Button 
                        variant="outlined" 
                        color="success" 
                        fullWidth
                        disabled
                        size="large"
                      >
                        Already Registered
                      </Button>
                    </Box>
                  ) : isRegistrationOpen ? (
                    <>
                      <Typography variant="body2" color="success.main" sx={{ mb: 2 }}>
                        ✓ Registration is open
                      </Typography>
                      <Button 
                        variant="contained" 
                        color="primary" 
                        fullWidth
                        onClick={handleRegister}
                        size="large"
                      >
                        Register Your Team
                      </Button>
                    </>
                  ) : (
                    <Typography variant="body2" color="error.main">
                      ✗ Registration deadline has passed
                    </Typography>
                  )}
                </Box>
              )}
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Container>
  );
};

export default HackathonDetailsPage;
