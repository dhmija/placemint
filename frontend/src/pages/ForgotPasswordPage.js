import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Container,
  Link,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { forgotPassword } from '../services/api';
import './AuthLayout.css';
import Logo from '../assets/logo.png';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setMessage('A password reset OTP has been sent to your email.');
      // Navigate to the next step
      navigate('/verify-reset-otp', { state: { email } });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-layout">
      <div className="auth-left-panel">
        <img src={Logo} alt="Logo" />
        <Typography variant="h4" component="h1">
          Reset Your Password
        </Typography>
        <Typography variant="body1">
          No worries, we'll send you reset instructions.
        </Typography>
      </div>
      <div className="auth-right-panel">
        <Container maxWidth="xs">
          <Box
            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            component="form"
            onSubmit={handleSubmit}
          >
            <Typography variant="h4" gutterBottom sx={{ color: '#ffffff' }}>
              Forgot Password?
            </Typography>
            <Typography variant="body2" align="center" sx={{ mb: 2 }}>
              Enter your email address and we'll send you an OTP to reset your password.
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{error}</Alert>}
            {message && <Alert severity="success" sx={{ mb: 2, width: '100%' }}>{message}</Alert>}

            <TextField
              label="Email Address"
              variant="outlined"
              margin="normal"
              required
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={loading}
              sx={{ mt: 3, mb: 2, py: 1.5 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Send Reset OTP'}
            </Button>

            <Link component={RouterLink} to="/login" variant="body2">
              Back to Login
            </Link>
          </Box>
        </Container>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;