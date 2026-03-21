import React from 'react';
import { Box, Typography, Button, Container, Card, CardContent, Grid, Paper } from '@mui/material';
import TopCompanies from '../components/TopCompanies';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Logo from '../assets/logo.png';
import WorkIcon from '@mui/icons-material/Work';
import SchoolIcon from '@mui/icons-material/School';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PeopleIcon from '@mui/icons-material/People';

const HomePage = () => {
  const { isAuthenticated, user, redirectToDashboard } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      redirectToDashboard(user.role);
    } else {
      navigate('/login');
    }
  };

  const features = [
    {
      icon: <WorkIcon sx={{ fontSize: 40, color: '#0066cc' }} />,
      title: 'Job Opportunities',
      description: 'Explore curated job positions from leading companies',
    },
    {
      icon: <SchoolIcon sx={{ fontSize: 40, color: '#0066cc' }} />,
      title: 'Skill Development',
      description: 'Take quizzes and tasks to enhance your skills',
    },
    {
      icon: <VideoLibraryIcon sx={{ fontSize: 40, color: '#0066cc' }} />,
      title: 'Mock Interviews',
      description: 'Practice with AI-powered mock interview sessions',
    },
    {
      icon: <EmojiEventsIcon sx={{ fontSize: 40, color: '#0066cc' }} />,
      title: 'Hackathons',
      description: 'Participate in exciting hackathon competitions',
    },
    {
      icon: <AssignmentIcon sx={{ fontSize: 40, color: '#0066cc' }} />,
      title: 'Tasks & Challenges',
      description: 'Complete challenging tasks to earn recognition',
    },
    {
      icon: <PeopleIcon sx={{ fontSize: 40, color: '#0066cc' }} />,
      title: 'Community',
      description: 'Connect with peers and industry professionals',
    },
  ];

  return (
    <Box sx={{ bgcolor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0066cc 0%, #004499 100%)',
          color: 'white',
          py: { xs: 6, md: 8 },
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '-50%',
            right: '-10%',
            width: '500px',
            height: '500px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%',
            zIndex: 0,
          },
        }}
      >
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ mb: 3 }}>
            <img 
              src={Logo} 
              alt="Logo" 
              style={{ width: 100, height: 'auto', filter: 'brightness(0) invert(1)' }} 
            />
          </Box>
          <Typography 
            variant="h2" 
            component="h1" 
            gutterBottom 
            sx={{ 
              fontWeight: 800, 
              fontSize: { xs: '2rem', md: '3rem' },
              mb: 2,
            }}
          >
            Welcome to Placement Portal
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 4, 
              opacity: 0.95,
              fontSize: { xs: '0.95rem', md: '1.1rem' },
              fontWeight: 400,
            }}
          >
            Your comprehensive platform for career growth, skill development, and recruitment success
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            {isAuthenticated ? (
              <Button
                variant="contained"
                color="inherit"
                size="large"
                onClick={handleGetStarted}
                sx={{
                  bgcolor: 'white',
                  color: '#0066cc',
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  fontSize: '1rem',
                  '&:hover': {
                    bgcolor: '#f0f0f0',
                  },
                }}
              >
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button
                  component={RouterLink}
                  to="/login"
                  variant="contained"
                  size="large"
                  sx={{
                    bgcolor: 'white',
                    color: '#0066cc',
                    fontWeight: 600,
                    px: 4,
                    py: 1.5,
                    fontSize: '1rem',
                    '&:hover': {
                      bgcolor: '#f0f0f0',
                    },
                  }}
                >
                  Sign In
                </Button>
                <Button
                  component={RouterLink}
                  to="/register"
                  variant="outlined"
                  size="large"
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    fontWeight: 600,
                    px: 4,
                    py: 1.5,
                    fontSize: '1rem',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.1)',
                      borderColor: 'white',
                    },
                  }}
                >
                  Register
                </Button>
              </>
            )}
          </Box>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 700, 
            textAlign: 'center', 
            mb: 6,
            fontSize: { xs: '1.8rem', md: '2.5rem' },
            color: '#222',
          }}
        >
          Explore Our Opportunities
        </Typography>

        <Grid container spacing={3}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  textAlign: 'center',
                  p: 3,
                  border: 'none',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography 
                    variant="h6" 
                    sx={{ fontWeight: 600, mb: 1.5, color: '#222' }}
                  >
                    {feature.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="textSecondary"
                    sx={{ lineHeight: 1.6, color: '#666' }}
                  >
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Top Companies Section */}
      <TopCompanies />
      {/* Stats Section */}
      <Box sx={{ bgcolor: '#fff', py: { xs: 4, md: 6 } }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={6} md={3} sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#0066cc', mb: 1 }}>
                500+
              </Typography>
              <Typography color="textSecondary" sx={{ fontWeight: 500 }}>
                Job Positions
              </Typography>
            </Grid>
            <Grid item xs={6} md={3} sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#0066cc', mb: 1 }}>
                10K+
              </Typography>
              <Typography color="textSecondary" sx={{ fontWeight: 500 }}>
                Active Students
              </Typography>
            </Grid>
            <Grid item xs={6} md={3} sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#0066cc', mb: 1 }}>
                100+
              </Typography>
              <Typography color="textSecondary" sx={{ fontWeight: 500 }}>
                Partner Companies
              </Typography>
            </Grid>
            <Grid item xs={6} md={3} sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#0066cc', mb: 1 }}>
                85%
              </Typography>
              <Typography color="textSecondary" sx={{ fontWeight: 500 }}>
                Placement Rate
              </Typography>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      {!isAuthenticated && (
        <Box
          sx={{
            background: 'linear-gradient(135deg, #004499 0%, #0066cc 100%)',
            color: 'white',
            py: { xs: 6, md: 8 },
            textAlign: 'center',
          }}
        >
          <Container maxWidth="md">
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 700, 
                mb: 3,
                fontSize: { xs: '1.8rem', md: '2.2rem' },
              }}
            >
              Ready to Start Your Career Journey?
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                mb: 4, 
                opacity: 0.95,
                fontSize: '1.05rem',
              }}
            >
              Join thousands of students already advancing their careers
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                component={RouterLink}
                to="/register"
                variant="contained"
                size="large"
                sx={{
                  bgcolor: 'white',
                  color: '#0066cc',
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  fontSize: '1rem',
                  '&:hover': {
                    bgcolor: '#f0f0f0',
                  },
                }}
              >
                Sign Up Now
              </Button>
              <Button
                component={RouterLink}
                to="/login"
                variant="outlined"
                size="large"
                sx={{
                  borderColor: 'white',
                  color: 'white',
                  fontWeight: 600,
                  px: 4,
                  py: 1.5,
                  fontSize: '1rem',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.1)',
                    borderColor: 'white',
                  },
                }}
              >
                Sign In
              </Button>
            </Box>
          </Container>
        </Box>
      )}
    </Box>
  );
};

export default HomePage;