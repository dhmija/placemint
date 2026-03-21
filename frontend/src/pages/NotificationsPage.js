import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button
} from '@mui/material';
import { getMyNotifications, markAllNotificationsAsRead, markNotificationAsRead } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { fetchUnreadCount } = useAuth();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await getMyNotifications();
      setNotifications(data.notifications);
      fetchUnreadCount(); // Sync count
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load notifications.');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleNotificationClick = async (notification) => {
    if (!notification.isRead) {
      try {
        await markNotificationAsRead(notification._id);
        fetchNotifications(); // Refetch all
      } catch (err) {
        console.error('Failed to mark as read');
      }
    }
    navigate(notification.relatedLink || '#');
  };
  
  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      fetchNotifications(); // Refetch all
    } catch (err) {
      setError('Failed to mark all as read.');
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Notifications
        </Typography>
        <Button
          variant="outlined"
          onClick={handleMarkAllRead}
          disabled={notifications.every(n => n.isRead)}
        >
          Mark All as Read
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {loading ? (
        <Box display="flex" justifyContent="center" mt={5}><CircularProgress /></Box>
      ) : (
        <Paper>
          {notifications.length === 0 ? (
            <Typography sx={{ p: 3, textAlign: 'center' }}>
              You have no notifications.
            </Typography>
          ) : (
            <List sx={{ p: 0 }}>
              {notifications.map((notif, index) => (
                <React.Fragment key={notif._id}>
                  <ListItem
                    button
                    onClick={() => handleNotificationClick(notif)}
                    sx={{
                      bgcolor: notif.isRead ? 'transparent' : 'action.hover',
                    }}
                  >
                    <ListItemText
                      primary={notif.message}
                      secondary={new Date(notif.createdAt).toLocaleString()}
                      primaryTypographyProps={{
                        fontWeight: notif.isRead ? 400 : 600,
                      }}
                    />
                  </ListItem>
                  {index < notifications.length - 1 && <Divider component="li" />}
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>
      )}
    </Container>
  );
};

export default NotificationsPage;