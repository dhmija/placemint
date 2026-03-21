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
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { createAnnouncement } from '../services/api'; // We'd need get/update for editing

const AnnouncementForm = () => {
  const { id } = useParams(); // Announcement ID
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    externalLink: '',
    type: 'Announcement', // Default type
    eventDate: '',
    location: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Note: Full edit functionality would require a getAnnouncementById endpoint
  useEffect(() => {
    if (id) {
      // Logic to fetch announcement by ID would go here
      setError("Editing announcements is not yet fully implemented.");
    }
  }, [id]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      if (id) {
        // await updateAnnouncement(id, formData);
        // setSuccess('Announcement updated successfully!');
      } else {
        await createAnnouncement(formData);
        setSuccess('Announcement created successfully!');
      }
      
      setTimeout(() => navigate('/tpo/dashboard'), 2000);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save announcement.');
    }
    setLoading(false);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }} component="form" onSubmit={handleSubmit}>
        <Typography variant="h4" gutterBottom>
          {id ? 'Edit Announcement' : 'Create New Announcement'}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} sm={8}>
            <TextField
              name="title"
              label="Title"
              value={formData.title}
              onChange={handleChange}
              required
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel id="type-select-label">Type</InputLabel>
              <Select
                name="type"
                labelId="type-select-label"
                label="Type"
                value={formData.type}
                onChange={handleChange}
              >
                <MenuItem value="Announcement">Announcement</MenuItem>
                <MenuItem value="Opportunity">Opportunity</MenuItem>
                <MenuItem value="Contest">Contest</MenuItem>
                <MenuItem value="Hackathon">Hackathon</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="content"
              label="Content (Body of the announcement)"
              value={formData.content}
              onChange={handleChange}
              required
              fullWidth
              multiline
              rows={8}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="externalLink"
              label="External Link (Optional, e.g., https://company.com/contest)"
              value={formData.externalLink}
              onChange={handleChange}
              fullWidth
            />
          </Grid>
          {(formData.type === 'Hackathon' || formData.type === 'Contest') && (
            <>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="eventDate"
                  label="Event Date"
                  type="datetime-local"
                  value={formData.eventDate}
                  onChange={handleChange}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  name="location"
                  label="Location (e.g., Online, Auditorium)"
                  value={formData.location}
                  onChange={handleChange}
                  fullWidth
                />
              </Grid>
            </>
          )}
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading || !!id} // Disable submit if in (unsupported) edit mode
              fullWidth
              sx={{ py: 1.5 }}
            >
              {loading ? <CircularProgress size={24} /> : (id ? 'Save Changes (Disabled)' : 'Post Announcement')}
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default AnnouncementForm;