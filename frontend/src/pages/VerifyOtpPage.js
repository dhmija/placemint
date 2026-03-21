import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Container,
} from '@mui/material';
import { useLocation, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sendVerificationOtp, verifyOtp } from '../services/api';
import { jwtDecode } from 'jwt-decode';
import './AuthLayout.css';
import Logo from '../assets/logo.png';

const VerifyOtpPage = () => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const { setAuthData } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  if (!email) {
    // If no email in state, redirect to login
    navigate('/login');
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError('OTP must be 6 digits.');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const { data } = await verifyOtp({ email, otp });
      const decoded = jwtDecode(data.token);
      setAuthData(decoded, data.token);
      // New user, redirect to create profile
      navigate('/profile'); 
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed.');
    }
    setLoading(false);
  };

  const handleResendOtp = async () => {
    setError('');
    setMessage('');
    setResendLoading(true);
    try {
      await sendVerificationOtp(email);
      setMessage('A new OTP has been sent to your email.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    }
    setResendLoading(false);
  };

  return (
    <div className="auth-layout">
      <div className="auth-left-panel">
        <img src={Logo} alt="Logo" />
        <Typography variant="h4" component="h1">
          Verify Your Email
        </Typography>
        <Typography variant="body1">
          Please check your inbox for a 6-digit code.
        </Typography>
      </div>
      <div className="auth-right-panel">
        <Container maxWidth="xs">
          <Box
            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            component="form"
            onSubmit={handleSubmit}
          >
            <Typography variant="h4" gutterBottom>
              Enter OTP
            </Typography>
            <Typography variant="body2" align="center" sx={{ mb: 2 }}>
              An OTP has been sent to <strong>{email}</strong>.
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{error}</Alert>}
            {message && <Alert severity="success" sx={{ mb: 2, width: '100%' }}>{message}</Alert>}

            <TextField
              label="6-Digit OTP"
              variant="outlined"
              margin="normal"
              required
              fullWidth
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              inputProps={{ maxLength: 6 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={loading}
              sx={{ mt: 3, mb: 2, py: 1.5 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Verify Account'}
            </Button>

            <Button
              fullWidth
              variant="text"
              onClick={handleResendOtp}
              disabled={resendLoading}
            >
              {resendLoading ? <CircularProgress size={24} /> : 'Resend OTP'}
            </Button>
            
            <RouterLink to="/login" style={{ marginTop: '16px' }}>
              Back to Login
            </RouterLink>
          </Box>
        </Container>
      </div>
    </div>
  );
};

export default VerifyOtpPage;