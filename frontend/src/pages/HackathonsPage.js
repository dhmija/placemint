import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Box,
  Typography,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllHackathons } from '../services/api';

const HackathonsPage = () => {
  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchHackathons();
  }, []);

  const fetchHackathons = async () => {
    try {
      setLoading(true);
      const response = await getAllHackathons();
      setHackathons(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch hackathons');
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
      month: 'short',
      day: 'numeric',
    });
  };

  const handleViewDetails = (hackathonId) => {
    navigate(`/hackathons/${hackathonId}`);
  };

  const handleRegister = (hackathonId) => {
    navigate(`/hackathons/${hackathonId}/register`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
          Hackathons
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Discover and register for upcoming hackathons
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {hackathons.length === 0 ? (
        <Alert severity="info">No hackathons available at the moment.</Alert>
      ) : (
        <Grid container spacing={3}>
          {hackathons.map((hackathon) => (
            <Grid item xs={12} sm={6} md={4} key={hackathon._id}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                '&:hover': { boxShadow: 4 },
                transition: 'all 0.3s ease'
              }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <Typography variant="h6" component="h2" sx={{ flexGrow: 1 }}>
                      {hackathon.title}
                    </Typography>
                    <Chip 
                      label={hackathon.status} 
                      size="small" 
                      color={getStatusColor(hackathon.status)} 
                    />
                  </Box>

                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                    {hackathon.organization}
                  </Typography>

                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Location:</strong> {hackathon.location}
                  </Typography>

                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Start:</strong> {formatDate(hackathon.startDate)}
                  </Typography>

                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>End:</strong> {formatDate(hackathon.endDate)}
                  </Typography>

                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Registration Deadline:</strong> {formatDate(hackathon.registrationDeadline)}
                  </Typography>

                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Prize:</strong> {hackathon.prize}
                  </Typography>

                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <strong>Max Team Size:</strong> {hackathon.maxTeamSize} members
                  </Typography>

                  <Typography variant="body2" sx={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    {hackathon.description}
                  </Typography>
                </CardContent>

                <CardActions sx={{ pt: 0 }}>
                  <Button 
                    size="small" 
                    onClick={() => handleViewDetails(hackathon._id)}
                  >
                    View Details
                  </Button>
                  {user?.role === 'student' && new Date() <= new Date(hackathon.registrationDeadline) && (
                    <Button 
                      size="small" 
                      variant="contained" 
                      color="primary"
                      onClick={() => handleRegister(hackathon._id)}
                    >
                      Register
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default HackathonsPage;
