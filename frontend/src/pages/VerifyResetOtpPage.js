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
import { verifyPasswordResetOtp } from '../services/api';
import './AuthLayout.css';
import Logo from '../assets/logo.png';

const VerifyResetOtpPage = () => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  if (!email) {
    navigate('/forgot-password');
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await verifyPasswordResetOtp({ email, otp });
      // On success, navigate to the final reset page with the token
      navigate('/reset-password', { state: { email, token: data.resetToken } });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-layout">
      <div className="auth-left-panel">
        <img src={Logo} alt="Logo" />
        <Typography variant="h4" component="h1">
          Check Your Email
        </Typography>
        <Typography variant="body1">
          Enter the 6-digit code we sent you.
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
              Enter Reset OTP
            </Typography>
            <Typography variant="body2" align="center" sx={{ mb: 2 }}>
              An OTP has been sent to <strong>{email}</strong>.
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{error}</Alert>}

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
              {loading ? <CircularProgress size={24} /> : 'Verify OTP'}
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

export default VerifyResetOtpPage;