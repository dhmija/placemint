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
import { useLocation, useNavigate } from 'react-router-dom';
import { resetPassword } from '../services/api';
import './AuthLayout.css';
import Logo from '../assets/logo.png';

const ResetPasswordPage = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email;
  const token = location.state?.token;

  if (!email || !token) {
    navigate('/login');
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await resetPassword({ email, token, newPassword });
      setMessage('Password reset successfully! You can now log in.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-layout">
      <div className="auth-left-panel">
        <img src={Logo} alt="Logo" />
        <Typography variant="h4" component="h1">
          Set New Password
        </Typography>
        <Typography variant="body1">
          Choose a strong, new password.
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
              Reset Password
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{error}</Alert>}
            {message && <Alert severity="success" sx={{ mb: 2, width: '100%' }}>{message}</Alert>}

            <TextField
              label="New Password"
              variant="outlined"
              margin="normal"
              required
              fullWidth
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <TextField
              label="Confirm New Password"
              variant="outlined"
              margin="normal"
              required
              fullWidth
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={loading || !!message}
              sx={{ mt: 3, mb: 2, py: 1.5 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Set New Password'}
            </Button>
          </Box>
        </Container>
      </div>
    </div>
  );
};

export default ResetPasswordPage;