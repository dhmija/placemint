import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Container } from '@mui/material';
// --- THIS IS THE FIX ---
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import MessagingButton from './MessagingButton';
import Logo from '../assets/logo.png'; // Importing your logo

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogoClick = () => {
    if (isAuthenticated) {
      // Navigate to the user's specific dashboard
      switch (user.role) {
        case 'student':
          navigate('/dashboard');
          break;
        case 'recruiter':
          navigate('/admin/dashboard');
          break;
        case 'placementcell':
          navigate('/tpo/dashboard');
          break;
        default:
          navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  return (
    <AppBar position="static" color="default" sx={{ bgcolor: 'white' }}>
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          {/* Logo and Title */}
          <Box
            onClick={handleLogoClick}
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flexGrow: 1 }}
          >
            <img src={Logo} alt="Logo" style={{ height: 40, marginRight: 10 }} />
            <Typography
              variant="h6"
              noWrap
              sx={{
                fontWeight: 700,
                color: 'primary.main',
              }}
            >
              Placement Portal
            </Typography>
          </Box>

          {/* Nav Links */}
          <Box sx={{ flexGrow: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
            {isAuthenticated ? (
              <>
                {user.role === 'student' && (
                  <>
                    <Button component={RouterLink} to="/dashboard" color="inherit">
                      Jobs
                    </Button>
                    <Button component={RouterLink} to="/hackathons" color="inherit">
                      Hackathons
                    </Button>
                    <Button component={RouterLink} to="/my-applications" color="inherit">
                      My Applications
                    </Button>
                    <Button component={RouterLink} to="/profile" color="inherit">
                      Profile
                    </Button>
                  </>
                )}
                {user.role === 'recruiter' && (
                  <>
                    <Button component={RouterLink} to="/admin/dashboard" color="inherit">
                      My Jobs
                    </Button>
                    <Button component={RouterLink} to="/admin/job/new" color="inherit">
                      Post Job
                    </Button>
                  </>
                )}
                {user.role === 'placementcell' && (
                  <>
                    <Button component={RouterLink} to="/tpo/dashboard" color="inherit">
                      TPO Dashboard
                    </Button>
                    <Button component={RouterLink} to="/tpo/hackathons/manage" color="inherit">
                      Hackathons
                    </Button>
                  </>
                )}

                <MessagingButton />
                <NotificationBell />
                <Button variant="outlined" onClick={logout} sx={{ ml: 1 }}>
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button component={RouterLink} to="/login" variant="contained" color="primary">
                  Sign In
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;