import React, { useState, useEffect } from 'react';
import {
  Container,
  Card,
  CardContent,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { createHackathon, getAllHackathons, updateHackathon, deleteHackathon } from '../services/api';

const HackathonManagementPage = () => {
  const navigate = useNavigate();

  const [hackathons, setHackathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [openDialog, setOpenDialog] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    organization: '',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    location: 'Online',
    prize: 'TBD',
    maxTeamSize: 4,
  });

  useEffect(() => {
    fetchHackathons();
  }, []);

  const fetchHackathons = async () => {
    try {
      setLoading(true);
      const response = await getAllHackathons();
      setHackathons(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch hackathons');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (hackathon = null) => {
    if (hackathon) {
      setEditingId(hackathon._id);
      setFormData({
        title: hackathon.title,
        description: hackathon.description,
        organization: hackathon.organization,
        startDate: hackathon.startDate.split('T')[0],
        endDate: hackathon.endDate.split('T')[0],
        registrationDeadline: hackathon.registrationDeadline.split('T')[0],
        location: hackathon.location,
        prize: hackathon.prize,
        maxTeamSize: hackathon.maxTeamSize,
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        description: '',
        organization: '',
        startDate: '',
        endDate: '',
        registrationDeadline: '',
        location: 'Online',
        prize: 'TBD',
        maxTeamSize: 4,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingId(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Please enter hackathon title');
      return false;
    }
    if (!formData.description.trim()) {
      setError('Please enter description');
      return false;
    }
    if (!formData.organization.trim()) {
      setError('Please enter organization');
      return false;
    }
    if (!formData.startDate || !formData.endDate || !formData.registrationDeadline) {
      setError('Please fill all date fields');
      return false;
    }
    if (new Date(formData.registrationDeadline) > new Date(formData.startDate)) {
      setError('Registration deadline must be before start date');
      return false;
    }
    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      setError('End date must be after start date');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      if (editingId) {
        await updateHackathon(editingId, formData);
        setSuccess('Hackathon updated successfully!');
      } else {
        await createHackathon(formData);
        setSuccess('Hackathon created successfully!');
      }

      handleCloseDialog();
      fetchHackathons();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save hackathon');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this hackathon?')) {
      try {
        setSubmitting(true);
        await deleteHackathon(id);
        setSuccess('Hackathon deleted successfully!');
        fetchHackathons();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete hackathon');
        console.error(err);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming':
        return 'info';
      case 'ongoing':
        return 'success';
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          Hackathon Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleOpenDialog()}
        >
          Create New Hackathon
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

      {hackathons.length === 0 ? (
        <Alert severity="info">No hackathons created yet.</Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ bgcolor: 'primary.main' }}>
              <TableRow>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Title</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Organization</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Start Date</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Registrations</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {hackathons.map((hackathon) => (
                <TableRow key={hackathon._id}>
                  <TableCell>{hackathon.title}</TableCell>
                  <TableCell>{hackathon.organization}</TableCell>
                  <TableCell>
                    <Chip
                      label={hackathon.status}
                      color={getStatusColor(hackathon.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{formatDate(hackathon.startDate)}</TableCell>
                  <TableCell>
                    {hackathon.registrations ? hackathon.registrations.length : 0}
                  </TableCell>
                  <TableCell>
                    <Button
                      startIcon={<EditIcon />}
                      size="small"
                      onClick={() => handleOpenDialog(hackathon)}
                      disabled={submitting}
                    >
                      Edit
                    </Button>
                    <Button
                      startIcon={<DeleteIcon />}
                      size="small"
                      color="error"
                      onClick={() => handleDelete(hackathon._id)}
                      disabled={submitting}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingId ? 'Edit Hackathon' : 'Create New Hackathon'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3, display: 'grid', gap: 2 }}>
          <TextField
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            fullWidth
            required
          />
          <TextField
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            fullWidth
            required
            multiline
            rows={3}
          />
          <TextField
            label="Organization"
            name="organization"
            value={formData.organization}
            onChange={handleInputChange}
            fullWidth
            required
          />
          <TextField
            label="Location"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            fullWidth
          />
          <TextField
            label="Prize"
            name="prize"
            value={formData.prize}
            onChange={handleInputChange}
            fullWidth
          />
          <TextField
            label="Start Date"
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={handleInputChange}
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="End Date"
            name="endDate"
            type="date"
            value={formData.endDate}
            onChange={handleInputChange}
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Registration Deadline"
            name="registrationDeadline"
            type="date"
            value={formData.registrationDeadline}
            onChange={handleInputChange}
            fullWidth
            required
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Max Team Size"
            name="maxTeamSize"
            type="number"
            value={formData.maxTeamSize}
            onChange={handleInputChange}
            fullWidth
            required
            InputProps={{ inputProps: { min: 1, max: 10 } }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={submitting}
          >
            {submitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default HackathonManagementPage;
