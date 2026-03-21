import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  IconButton,
  Paper,
  Divider,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '../context/AuthContext';
import { getHackathonById, registerTeamForHackathon, getUserHackathonRegistrations } from '../services/api';

const HackathonRegistrationPage = () => {
  const { hackathonId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [hackathon, setHackathon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);

  const [teamName, setTeamName] = useState('');
  const [teamMembers, setTeamMembers] = useState([
    { userId: user?.id || '', rollNumber: '', role: 'Team Lead' },
  ]);

  useEffect(() => {
    fetchHackathonDetails();
    checkRegistrationStatus();
  }, [hackathonId, user]);

  const checkRegistrationStatus = async () => {
    try {
      const response = await getUserHackathonRegistrations();
      const userRegistrations = response.data;
      
      // Check if user is registered for this hackathon
      const isRegistered = userRegistrations.some(reg => {
        const regHackathonId = typeof reg.hackathon === 'object' ? reg.hackathon._id : reg.hackathon;
        return regHackathonId === hackathonId;
      });
      
      setIsAlreadyRegistered(isRegistered);
      if (isRegistered) {
        setError('You are already registered for this hackathon');
      }
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

  const handleAddMember = () => {
    if (teamMembers.length < (hackathon?.maxTeamSize || 5)) {
      setTeamMembers([
        ...teamMembers,
        { userId: '', rollNumber: '', role: '' },
      ]);
    }
  };

  const handleRemoveMember = (index) => {
    if (teamMembers.length > 1) {
      const newMembers = teamMembers.filter((_, i) => i !== index);
      setTeamMembers(newMembers);
    }
  };

  const handleMemberChange = (index, field, value) => {
    const newMembers = [...teamMembers];
    newMembers[index][field] = value;
    setTeamMembers(newMembers);
  };

  const validateForm = () => {
    if (!teamName.trim()) {
      setError('Please enter a team name');
      return false;
    }

    if (teamMembers.length === 0) {
      setError('Please add at least one team member');
      return false;
    }

    for (let member of teamMembers) {
      if (!member.rollNumber.trim()) {
        setError('Please enter roll number for all team members');
        return false;
      }
      if (!member.role.trim()) {
        setError('Please enter role for all team members');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      const registrationData = {
        teamName,
        teamMembers: teamMembers.map((member) => ({
          userId: user?.id,
          rollNumber: member.rollNumber,
          role: member.role,
        })),
      };

      await registerTeamForHackathon(hackathonId, registrationData);

      setSuccess('Team registered successfully!');
      setTimeout(() => {
        navigate(`/hackathons/${hackathonId}`);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register team');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

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
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Button onClick={() => navigate(`/hackathons/${hackathonId}`)} sx={{ mb: 3 }}>
        ← Back to Details
      </Button>

      <Card>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 2 }}>
            Register Your Team
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
            for {hackathon.title}
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

          <form onSubmit={handleSubmit}>
            {/* Team Name */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Team Information
              </Typography>
              <TextField
                fullWidth
                label="Team Name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Enter your team name"
                required
                disabled={submitting}
              />
            </Box>

            {/* Team Members */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Team Members ({teamMembers.length}/{hackathon.maxTeamSize})
                </Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={handleAddMember}
                  disabled={teamMembers.length >= hackathon.maxTeamSize || submitting}
                  size="small"
                  variant="outlined"
                >
                  Add Member
                </Button>
              </Box>

              {teamMembers.map((member, index) => (
                <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      Member {index + 1}
                    </Typography>
                    {teamMembers.length > 1 && (
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveMember(index)}
                        disabled={submitting}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Roll Number"
                        value={member.rollNumber}
                        onChange={(e) => handleMemberChange(index, 'rollNumber', e.target.value)}
                        placeholder="e.g., B22CS001"
                        required
                        disabled={submitting}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Role"
                        value={member.role}
                        onChange={(e) => handleMemberChange(index, 'role', e.target.value)}
                        placeholder="e.g., Frontend Developer"
                        required
                        disabled={submitting}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Info Box */}
            <Alert severity="info" sx={{ mb: 3 }}>
              All team members must be from the same institution. Each member must have a valid roll number.
            </Alert>

            {/* Submit Buttons */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                type="submit"
                disabled={submitting || isAlreadyRegistered}
                size="large"
              >
                {isAlreadyRegistered ? 'Already Registered' : submitting ? 'Registering...' : 'Register Team'}
              </Button>
              <Button
                variant="outlined"
                onClick={() => navigate(`/hackathons/${hackathonId}`)}
                disabled={submitting}
              >
                Cancel
              </Button>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
};

export default HackathonRegistrationPage;
