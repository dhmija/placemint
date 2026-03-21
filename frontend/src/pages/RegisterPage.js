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
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import './AuthLayout.css';
import Logo from '../assets/logo.png';
import { registerUser } from '../services/api';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const captchaRef = useRef(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    const captchaToken = captchaRef.current.getValue();
    if (!captchaToken) {
      setError('Please complete the reCAPTCHA.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await registerUser({ email, password, role, captchaToken });
      // On success, navigate to OTP page
      navigate('/verify-otp', { state: { email } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      captchaRef.current.reset();
    }
    setLoading(false);
  };

  return (
    <div className="auth-layout">
      <div className="auth-left-panel">
        <img src={Logo} alt="Logo" />
        <Typography variant="h4" component="h1">
          Create Your Account
        </Typography>
        <Typography variant="body1">
          Join the next generation of professionals.
        </Typography>
      </div>
      <div className="auth-right-panel">
        <Box className="auth-form-container" component="form" onSubmit={handleSubmit}>
          <Typography variant="h4" gutterBottom sx={{ color: '#ffffff' }}>
            Register
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2, width: '100%' }}>{error}</Alert>}

          <FormControl component="fieldset" margin="normal">
            <FormLabel component="legend">I am a...</FormLabel>
            <RadioGroup row value={role} onChange={(e) => setRole(e.target.value)}>
              <FormControlLabel value="student" control={<Radio />} label="Student" />
              <FormControlLabel value="recruiter" control={<Radio />} label="Recruiter" />
            </RadioGroup>
          </FormControl>

          <TextField
            label="Email Address"
            variant="outlined"
            margin="normal"
            required
            fullWidth
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Password"
            variant="outlined"
            margin="normal"
            required
            fullWidth
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <TextField
            label="Confirm Password"
            variant="outlined"
            margin="normal"
            required
            fullWidth
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />

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
            {loading ? <CircularProgress size={24} /> : 'Register'}
          </Button>

          <Grid container justifyContent="center">
            <Typography>
              Already have an account?{' '}
              <Link component={RouterLink} to="/login" variant="body2">
                Sign in
              </Link>
            </Typography>
          </Grid>
        </Box>
      </div>
    </div>
  );
};

export default RegisterPage;