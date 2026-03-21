import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tabs,
  Tab,
  Button,
  Link as MuiLink,
  Chip,
  Divider
} from '@mui/material';
import { Edit, Delete, People, Add, Assessment, Code, Dashboard } from '@mui/icons-material';
import { getAllJobs, getAllProfiles, deleteJob, getAllAnnouncements, deleteAnnouncement } from '../services/api';
import { Link as RouterLink } from 'react-router-dom';

// Helper to get chip color for announcement type
const getChipColor = (type) => {
  switch (type) {
    case 'Contest':
      return 'secondary';
    case 'Opportunity':
      return 'success';
    case 'Announcement':
    default:
      return 'primary';
  }
};

const TPODashboardPage = () => {
  const [tab, setTab] = useState(0);
  const [jobs, setJobs] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const { data } = await getAllJobs();
      setJobs(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load jobs.');
    }
    setLoading(false);
  };

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const { data } = await getAllProfiles();
      setProfiles(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profiles.');
    }
    setLoading(false);
  };
  
  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const { data } = await getAllAnnouncements();
      setAnnouncements(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load announcements.');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (tab === 0) {
      fetchJobs();
    } else if (tab === 1) {
      fetchProfiles();
    } else {
      fetchAnnouncements();
    }
  }, [tab]);
  
  const handleJobDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      try {
        await deleteJob(id);
        fetchJobs(); // Refresh the list
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete job.');
      }
    }
  };
  
  const handleAnnouncementDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await deleteAnnouncement(id);
        fetchAnnouncements(); // Refresh the list
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete announcement.');
      }
    }
  };

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: 'calc(100vh - 64px)', p: 3 }}>
      <Container maxWidth="lg">
        <Paper elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: '8px', p: 3, bgcolor: '#f9f9f9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          {/* Header with Icon */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Dashboard sx={{ color: 'primary.main', fontSize: '2rem' }} />
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
              TPO Dashboard
            </Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs 
              value={tab} 
              onChange={handleTabChange} 
              variant="fullWidth"
              indicatorColor="secondary"
              textColor="secondary"
            >
              <Tab label="Manage Jobs" />
              <Tab label="Student Profiles" />
              <Tab label="Manage Announcements" />
            </Tabs>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          {loading ? (
            <Box display="flex" justifyContent="center" mt={5}><CircularProgress /></Box>
          ) : (
            <>
              {/* ----- All Jobs Tab ----- */}
              {tab === 0 && (
                jobs.length === 0 ? (
                  <Typography>No jobs posted yet.</Typography>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Title</TableCell>
                          <TableCell>Company</TableCell>
                          <TableCell>Screenings</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {jobs.map((job) => (
                          <TableRow hover key={job._id}>
                            <TableCell>{job.title}</TableCell>
                            <TableCell>{job.company}</TableCell>
                            <TableCell>
                              {job.quiz && <Chip label="Quiz" size="small" color="secondary" sx={{ mr: 0.5 }} />}
                              {job.task && <Chip label="Task" size="small" color="warning" />}
                            </TableCell>
                            <TableCell>
                              <IconButton component={RouterLink} to={`/tpo/job/applicants/${job._id}`} color="primary" title="View Applicants">
                                <People />
                              </IconButton>
                              <IconButton component={RouterLink} to={`/tpo/job/edit/${job._id}`} color="secondary" title="Edit Job">
                                <Edit />
                              </IconButton>
                              <IconButton onClick={() => handleJobDelete(job._id)} color="error" title="Delete Job">
                                <Delete />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )
              )}
              
              {/* ----- All Students Tab ----- */}
              {tab === 1 && (
                profiles.length === 0 ? (
                  <Typography>No student profiles found.</Typography>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Enrollment No.</TableCell>
                          <TableCell>GPA</TableCell>
                          <TableCell>Skills</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {profiles.map((profile) => (
                          <TableRow hover key={profile._id}>
                            <TableCell>{profile.name}</TableCell>
                            <TableCell>{profile.enrollmentNumber}</TableCell>
                            <TableCell>{profile.gpa || 'N/A'}</TableCell>
                            <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {profile.skills.join(', ')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )
              )}
              
              {/* ----- Announcements Tab (NEW) ----- */}
              {tab === 2 && (
                <Box>
                  <Button
                    component={RouterLink}
                    to="/tpo/announcement/new"
                    variant="contained"
                    color="primary"
                    startIcon={<Add />}
                    sx={{ mb: 3 }}
                  >
                    New Announcement
                  </Button>
                  {announcements.length === 0 ? (
                    <Typography>No announcements posted yet.</Typography>
                  ) : (
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Title</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>External Link</TableCell>
                            <TableCell>Posted On</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {announcements.map((item) => (
                            <TableRow hover key={item._id}>
                              <TableCell>{item.title}</TableCell>
                              <TableCell>
                                <Chip label={item.type} color={getChipColor(item.type)} size="small" />
                              </TableCell>
                              <TableCell>
                                {item.externalLink ? (
                                  <MuiLink href={item.externalLink} target="_blank" rel="noopener">View Link</MuiLink>
                                ) : 'N/A'}
                              </TableCell>
                              <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <IconButton onClick={() => handleAnnouncementDelete(item._id)} color="error" title="Delete">
                                  <Delete />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              )}
            </>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default TPODashboardPage;