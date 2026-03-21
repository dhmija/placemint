import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Box,
  Alert,
  Paper,
  Link as MuiLink,
  Chip,
  Divider,
  Autocomplete,
  TextField,
  MenuItem,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import WorkIcon from '@mui/icons-material/Work';
import TopCompanies from '../components/TopCompanies';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CampaignIcon from '@mui/icons-material/Campaign';
import SchoolIcon from '@mui/icons-material/School';
import { getAllJobs, getAllAnnouncements } from '../services/api';

// Mock Interview Roles Data - with PNG logo paths
const MOCK_INTERVIEW_ROLES = [
  { id: 1, title: 'AI Engineer', company: 'Google', logoPath: require('../assets/logos/google.png') },
  { id: 2, title: 'Machine Learning Engineer', company: 'OpenAI', logoPath: require('../assets/logos/openai.png') },
  { id: 3, title: 'iOS Developer', company: 'Uber', logoPath: require('../assets/logos/uber.png') },
  { id: 4, title: 'Blockchain Engineer', company: 'StarWare', logoPath: require('../assets/logos/starware.png') },
];

const StudentDashboardPage = () => {
  const [jobs, setJobs] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [roleOptions, setRoleOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedType, setSelectedType] = useState('All');
  const [selectedSite, setSelectedSite] = useState('All');
  const [selectedSalary, setSelectedSalary] = useState('All');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [jobsRes, announcementsRes] = await Promise.all([
          getAllJobs(),
          getAllAnnouncements(),
        ]);

        setJobs(jobsRes.data || []);

        // populate unique role/title options for the Role filter
        const titles = Array.from(
          new Set(
            (jobsRes.data || [])
              .map((j) => (j.title || j.role || '').trim())
              .filter(Boolean)
          )
        );
        setRoleOptions(titles);

        setAnnouncements(announcementsRes.data || []);
        setError('');
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to fetch data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Client-side filtering of jobs based on selectedRole and selectedType
  const filteredJobs = useMemo(
    () =>
      jobs.filter((job) => {
        const jobTitle = (job.title || job.role || '').toLowerCase();
        const roleMatch = selectedRole
          ? jobTitle.includes((selectedRole || '').toLowerCase())
          : true;
        const typeField = (job.jobType || job.type || '').toString();
        const typeMatch =
          !selectedType || selectedType === 'All'
            ? true
            : typeField.toLowerCase() === selectedType.toLowerCase();

        const siteField = (job.site || '').toString();
        const siteMatch =
          !selectedSite || selectedSite === 'All'
            ? true
            : siteField.toLowerCase() === selectedSite.toLowerCase();

        const salaryField = (job.salaryRange || job.salary || '').toString();
        const salaryMatch =
          !selectedSalary || selectedSalary === 'All'
            ? true
            : salaryField.toLowerCase() === selectedSalary.toLowerCase();

        return roleMatch && typeMatch && siteMatch && salaryMatch;
      }),
    [jobs, selectedRole, selectedType, selectedSite, selectedSalary]
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f4f6f8', minHeight: '100vh' }}>
      {/* Hero Section with Filters */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0066cc 0%, #004499 100%)',
          color: 'white',
          py: 8,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '-50%',
            right: '-5%',
            width: '400px',
            height: '400px',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%',
            zIndex: 0,
          },
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
            Welcome back! 👋
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, fontSize: '1.1rem' }}>
            Explore opportunities tailored for your career growth
          </Typography>
        </Container>
      </Box>

      {/* Filters Section */}
      <Container maxWidth="lg">
        <Box sx={{ py: 4 }}>
          <Paper elevation={0} sx={{ p: 3, border: '1px solid #e0e0e0', bgcolor: '#fff' }}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Autocomplete
                  options={roleOptions}
                  value={selectedRole}
                  onChange={(e, val) => setSelectedRole(val)}
                  freeSolo
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      label="Search by Role" 
                      size="small" 
                      variant="outlined"
                      sx={{ bgcolor: '#f5f5f5' }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  label="Job Type"
                  size="small"
                  variant="outlined"
                  sx={{ width: '100%', bgcolor: '#f5f5f5' }}
                >
                  <MenuItem value="All">All</MenuItem>
                  <MenuItem value="Intern">Intern</MenuItem>
                  <MenuItem value="Full Time">Full Time</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  value={selectedSite}
                  onChange={(e) => setSelectedSite(e.target.value)}
                  label="Job Site"
                  size="small"
                  variant="outlined"
                  sx={{ width: '100%', bgcolor: '#f5f5f5' }}
                >
                  <MenuItem value="All">All</MenuItem>
                  <MenuItem value="Online">Online</MenuItem>
                  <MenuItem value="Onsite">On-site</MenuItem>
                  <MenuItem value="Hybrid">Hybrid</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => {
                    setSelectedRole(null);
                    setSelectedType('All');
                    setSelectedSite('All');
                    setSelectedSalary('All');
                  }}
                  sx={{ height: '40px', fontWeight: 600 }}
                >
                  Clear All
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Box>
      </Container>

      {/* Section 2: Available Jobs - Grey Background Container */}
      <Box sx={{ bgcolor: '#f0f2f5', py: 8 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
            <WorkIcon sx={{ fontSize: '2.5rem', color: '#0066cc' }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Available Job Opportunities
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                {filteredJobs.length} opportunities matching your preferences
              </Typography>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {jobs.length === 0 ? (
            <Typography variant="body1" color="textSecondary">
              No jobs posted at the moment. Please check back later.
            </Typography>
          ) : filteredJobs.length === 0 ? (
            <Typography variant="body1" color="textSecondary">
              No jobs match the selected filters.
            </Typography>
          ) : (
            <Grid container spacing={3}>
              {filteredJobs.map((job) => (
                <Grid item xs={12} sm={6} md={4} key={job._id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      bgcolor: '#fff',
                      transition: 'all 0.2s ease',
                      border: '1px solid #e0e0e0',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
                        borderColor: '#0066cc',
                      },
                    }}
                  >
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}
                        >
                          {job.title}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ fontWeight: 600, color: '#666', mb: 1 }}
                        >
                          {job.company}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                          {job.quiz && (
                            <Chip label="Quiz" color="secondary" size="small" />
                          )}
                          {job.task && (
                            <Chip label="Task" color="warning" size="small" />
                          )}
                        </Box>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                          📍 {job.location || 'Location not specified'}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            mt: 1,
                          }}
                        >
                          {job.description}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button
                          component={RouterLink}
                          to={`/job/${job._id}`}
                          size="small"
                          sx={{ color: '#0066cc', fontWeight: 600 }}
                        >
                          View Details →
                        </Button>
                      </CardActions>
                    </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Container>
      </Box>

      {/* Section 1: Mock Interview Tests - Grey Background Container */}
      <Box
        sx={{
          bgcolor: '#f0f2f5',
          py: 8,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
            <SchoolIcon sx={{ fontSize: '2.5rem', color: '#1976d2' }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Company Mock Tests
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                Master your concepts with AI-Powered full-length mock tests for 360° preparation!
              </Typography>
            </Box>
            <Box sx={{ ml: 'auto' }}>
              <Button
                component={RouterLink}
                to="/interview-history"
                variant="outlined"
                size="small"
                sx={{ fontWeight: 600 }}
              >
                📊 View History
              </Button>
            </Box>
          </Box>
          <Grid container spacing={3}>
            {MOCK_INTERVIEW_ROLES.map((role) => (
              <Grid item xs={12} sm={6} md={3} key={role.id}>
                <Card
                  sx={{
                    height: '100%',
                    textAlign: 'center',
                    bgcolor: '#fff',
                    border: '1px solid #e0e0e0',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
                      borderColor: '#1976d2',
                    },
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      {/* Company logo box */}
                      <Box
                        sx={{
                          width: 88,
                          height: 88,
                          bgcolor: '#fafafa',
                          border: '1px solid #e0e0e0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 8,
                          overflow: 'hidden',
                        }}
                      >
                        <img 
                          src={role.logoPath} 
                          alt={`${role.company} logo`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      </Box>

                      <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
                        {role.title}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                        {role.company}
                      </Typography>
                      <Button
                        component={RouterLink}
                        to={`/mock-interview/${role.title.toLowerCase().replace(/\s+/g, '-')}`}
                        size="small"
                        variant="contained"
                        sx={{
                          bgcolor: '#1976d2',
                          fontWeight: 600,
                          textTransform: 'none',
                          fontSize: '0.95rem',
                          px: 3,
                        }}
                      >
                        Start Test →
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Top Companies (showcase) */}
      <TopCompanies />

      {/* Section 3: Hackathons & Contests - Grey Background Container */}
      <Box sx={{ bgcolor: '#f0f2f5', py: 8 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
            <EmojiEventsIcon sx={{ fontSize: '2.5rem', color: '#d32f2f' }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Upcoming Hackathons & Contests
              </Typography>
            </Box>
          </Box>

            {(() => {
              const events = announcements
                .filter((a) => a.type === 'Hackathon' || a.type === 'Contest')
                .sort(
                  (a, b) =>
                    new Date(a.eventDate || 0) - new Date(b.eventDate || 0)
                );

              if (events.length === 0) {
                return (
                  <Typography variant="body1" color="textSecondary">
                    No upcoming events at the moment.
                  </Typography>
                );
              }

              return (
                <Grid container spacing={3}>
                  {events.map((item) => (
                    <Grid item xs={12} sm={6} md={4} key={item._id}>
                      <Card
                        sx={{
                          height: '100%',
                          bgcolor: '#fff',
                          border: '1px solid #e0e0e0',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
                          },
                        }}
                      >
                        <CardContent sx={{ pb: 1 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                            <Typography
                              variant="h6"
                              sx={{ fontWeight: 700, color: '#d32f2f', flex: 1 }}
                            >
                              {item.title}
                            </Typography>
                            <Chip
                              label={item.type}
                              sx={{
                                bgcolor: item.type === 'Hackathon' ? '#d32f2f' : '#f57c00',
                                color: '#fff',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                              }}
                              size="small"
                            />
                          </Box>
                          <Typography
                            variant="body2"
                            color="textSecondary"
                            sx={{ mb: 1.5, whiteSpace: 'pre-wrap' }}
                          >
                            {item.content?.substring(0, 150)}...
                          </Typography>
                          {item.eventDate && (
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#d32f2f', mb: 0.5 }}>
                              📅 {new Date(item.eventDate).toLocaleDateString()}
                            </Typography>
                          )}
                          {item.location && (
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#d32f2f', mb: 1 }}>
                              📍 {item.location}
                            </Typography>
                          )}
                        </CardContent>
                        {item.externalLink && (
                          <CardActions>
                            <Button
                              href={item.externalLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              size="small"
                              fullWidth
                              variant="contained"
                              sx={{
                                bgcolor: '#d32f2f',
                                fontWeight: 600,
                                textTransform: 'none',
                                '&:hover': { bgcolor: '#b71c1c' },
                              }}
                            >
                              Register Here
                            </Button>
                          </CardActions>
                        )}
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              );
            })()}
        </Container>
      </Box>

      {/* Section 4: Announcements - Grey Background Container */}
      <Box sx={{ bgcolor: '#f0f2f5', py: 8 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
            <CampaignIcon sx={{ fontSize: '2.5rem', color: '#0066cc' }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 600, color: 'text.primary' }}>
                Recent Announcements
              </Typography>
            </Box>
          </Box>

            {(() => {
              const general = announcements.filter(
                (a) => a.type !== 'Hackathon' && a.type !== 'Contest'
              );

              if (general.length === 0) {
                return (
                  <Typography variant="body1" color="textSecondary">
                    No announcements at the moment.
                  </Typography>
                );
              }

              return (
                <Grid container spacing={3}>
                  {general.map((item) => (
                    <Grid item xs={12} sm={6} md={4} key={item._id}>
                      <Card
                        sx={{
                          height: '100%',
                          bgcolor: '#fff',
                          border: '1px solid #e0e0e0',
                          transition: 'all 0.2s ease',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.08)',
                            borderColor: '#0066cc',
                          },
                        }}
                      >
                        <CardContent sx={{ pb: 1 }}>
                          <Chip
                            label={item.type}
                            sx={{
                              bgcolor: '#0066cc',
                              color: '#fff',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              mb: 1,
                            }}
                            size="small"
                          />
                          <Typography
                            variant="h6"
                            sx={{ fontWeight: 700, color: '#0066cc', mb: 1 }}
                          >
                            {item.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="textSecondary"
                            sx={{ mb: 1.5, whiteSpace: 'pre-wrap' }}
                          >
                            {item.content?.substring(0, 150)}...
                          </Typography>
                          <Typography
                            variant="caption"
                            color="textDisabled"
                            display="block"
                          >
                            📅 {item.createdAt
                              ? new Date(item.createdAt).toLocaleDateString()
                              : '—'}
                          </Typography>
                        </CardContent>
                        {item.externalLink && (
                          <CardActions>
                            <MuiLink
                              href={item.externalLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{
                                fontWeight: 600,
                                color: '#d32f2f',
                                textDecoration: 'none',
                                fontSize: '0.9rem',
                              }}
                            >
                              Learn More →
                            </MuiLink>
                          </CardActions>
                        )}
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              );
            })()}
        </Container>
      </Box>
    </Box>
  );
};

export default StudentDashboardPage;
