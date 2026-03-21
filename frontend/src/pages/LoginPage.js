import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Link,
  Grid,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ReCAPTCHA from 'react-google-recaptcha';
import './AuthLayout.css';
import Logo from '../assets/logo.png';
import { loginUser } from '../services/api'; 
import { jwtDecode } from 'jwt-decode';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student'); // Default role
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const captchaRef = useRef(null);
  const navigate = useNavigate();
  const { setAuthData, redirectToDashboard } = useAuth(); // Get functions from context

  const handleRoleChange = (event, newRole) => {
    setRole(newRole);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const captchaToken = captchaRef.current.getValue();
    if (!captchaToken) {
      setError('Please complete the reCAPTCHA.');
      return;
    }
    setLoading(true);
    try {
      // Call API directly
      const { data } = await loginUser({ email, password, role, captchaToken });
      const decoded = jwtDecode(data.token);
      
      // Manually set auth data in context
      setAuthData(decoded, data.token); 
      
      // Redirect to the correct dashboard
      redirectToDashboard(decoded.role); 

    } catch (err) {
      // --- THIS IS THE FIX ---
      const errorMsg = err.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMsg);

      // If the error is "Account not verified", redirect to the OTP page
      if (errorMsg.includes('Account not verified')) {
        navigate('/verify-otp', { state: { email } });
      }
      // --- END OF FIX ---
    }
    setLoading(false);
    captchaRef.current.reset();
  };

  return (
    <div className="auth-layout">
      <div className="auth-left-panel">
        <img src={Logo} alt="Logo" />
        <Typography variant="h4" component="h1">
          Bennett University Placement Portal
        </Typography>
        <Typography variant="body1">
          One stop portal for students & companies for placements.
        </Typography>
      </div>
      <div className="auth-right-panel">
        <Box className="auth-form-container" component="form" onSubmit={handleSubmit}>
          <Typography variant="h4" gutterBottom sx={{ color: '#ffffff' }}>
            Sign In
          </Typography>
          
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs 
              value={role} 
              onChange={handleRoleChange} 
              variant="fullWidth"
              indicatorColor="secondary"
              textColor="secondary"
            >
              <Tab label="Student" value="student" />
              <Tab label="Recruiter" value="recruiter" />
              <Tab label="Coordinator" value="placementcell" />
              <Tab label="Verifier" value="verifier" />
            </Tabs>
          </Box>
          
          {error && <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{error}</Alert>}
          
          <TextField
            label="Email Address"
            variant="outlined"
            margin="normal"
            required
            fullWidth
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Password"
            variant="outlined"
            margin="normal"
            required
            fullWidth
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Grid container justifyContent="flex-end" sx={{ mt: 1 }}>
            <Link component={RouterLink} to="/forgot-password" variant="body2">
              Forgot password?
            </Link>
          </Grid>

          <Box sx={{ my: 2, display: 'flex', justifyContent: 'center' }}>
            <ReCAPTCHA
              ref={captchaRef}
              sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}
            />
          </Box>
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{ mt: 1, mb: 2, py: 1.5 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign In'}
          </Button>
          
          <Grid container justifyContent="center">
            <Typography>
              Don't have an account?{' '}
              <Link component={RouterLink} to="/register" variant="body2">
                Register now
              </Link>
            </Typography>
          </Grid>
        </Box>
      </div>
    </div>
  );
};

export default LoginPage;