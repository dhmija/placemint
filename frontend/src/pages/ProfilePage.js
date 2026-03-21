import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Box,
  Alert,
  Paper,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Autocomplete,
  Chip
} from '@mui/material';
import { getMyProfile, createOrUpdateProfile, getSkills } from '../services/api';

const ProfilePage = () => {
  const [formData, setFormData] = useState({
    name: '',
    enrollmentNumber: '',
    age: '',
    gender: 'Prefer not to say',
    gpa: '',
    skills: [],
  });
  const [resume, setResume] = useState(null);
  const [resumeName, setResumeName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [skillOptions, setSkillOptions] = useState([]);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const { data } = await getMyProfile();
        setFormData({
          name: data.name || '',
          enrollmentNumber: data.enrollmentNumber || '',
          age: data.age || '',
          gender: data.gender || 'Prefer not to say',
          gpa: data.gpa || '',
          skills: data.skills || [],
        });
        if (data.resumeURL) {
          setResumeName(data.resumeURL.split('/').pop());
        }
      } catch (err) {
        // It's ok if profile not found (404), means it's a new profile
        if (err.response?.status !== 404) {
          setError(err.response?.data?.message || 'Failed to load profile.');
        }
      }
      setLoading(false);
    };

    const fetchSkills = async () => {
      try {
        const { data } = await getSkills();
        setSkillOptions(data);
      } catch (err) {
        console.error('Failed to fetch skills');
      }
    };
    
    fetchProfile();
    fetchSkills();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setResume(e.target.files[0]);
    setResumeName(e.target.files[0] ? e.target.files[0].name : 'No file selected');
  };
  
  const handleSkillsChange = (event, newValue) => {
    setFormData({ ...formData, skills: newValue });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // We must use FormData because of the file upload
    const profileData = new FormData();
    profileData.append('name', formData.name);
    profileData.append('enrollmentNumber', formData.enrollmentNumber);
    profileData.append('age', formData.age);
    profileData.append('gender', formData.gender);
    profileData.append('gpa', formData.gpa);
    
    // Append skills as an array
    formData.skills.forEach(skill => {
      profileData.append('skills', skill);
    });

    if (resume) {
      profileData.append('resume', resume);
    }

    try {
      await createOrUpdateProfile(profileData);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    }
    setLoading(false);
  };

  if (loading && !formData.name) { // Only show full page loader on initial load
    return <Box display="flex" justifyContent="center" mt={5}><CircularProgress /></Box>;
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }} component="form" onSubmit={handleSubmit}>
        <Typography variant="h4" gutterBottom>
          My Profile
        </Typography>
        <Typography variant="body2" color="textSecondary" gutterBottom>
          Keep your profile up to date to increase your chances.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              name="name"
              label="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="enrollmentNumber"
              label="Enrollment Number"
              value={formData.enrollmentNumber}
              onChange={handleChange}
              required
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="age"
              label="Age"
              type="number"
              value={formData.age}
              onChange={handleChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              name="gpa"
              label="GPA (e.g., 8.5)"
              type="number"
              inputProps={{ step: "0.01", min: 0, max: 10 }}
              value={formData.gpa}
              onChange={handleChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl component="fieldset">
              <FormLabel component="legend">Gender</FormLabel>
              <RadioGroup
                row
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              >
                <FormControlLabel value="Male" control={<Radio />} label="Male" />
                <FormControlLabel value="Female" control={<Radio />} label="Female" />
                <FormControlLabel value="Other" control={<Radio />} label="Other" />
                <FormControlLabel value="Prefer not to say" control={<Radio />} label="Prefer not to say" />
              </RadioGroup>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Autocomplete
              multiple
              options={skillOptions}
              value={formData.skills}
              onChange={handleSkillsChange}
              freeSolo // Allows adding skills not in the list
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  label="Skills"
                  placeholder="e.g., React, Python, Data Analysis"
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              variant="outlined"
              component="label"
              fullWidth
            >
              Upload Resume (PDF, DOCX)
              <input
                type="file"
                hidden
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
              />
            </Button>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              {resumeName || 'No resume uploaded.'}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              fullWidth
              sx={{ py: 1.5 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Save Profile'}
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default ProfilePage;