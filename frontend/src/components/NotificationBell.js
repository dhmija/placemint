import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Box
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getMyNotifications, markNotificationAsRead } from '../services/api';

const NotificationBell = () => {
  const { unreadCount, fetchUnreadCount } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const isOpen = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    fetchNotifications();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await getMyNotifications();
      setNotifications(data.notifications);
      fetchUnreadCount(); // Sync context count
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
    setLoading(false);
  };

  const handleNotificationClick = async (notification) => {
    handleClose();
    if (!notification.isRead) {
      try {
        await markNotificationAsRead(notification._id);
        fetchUnreadCount(); // Update the badge count
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }
    navigate(notification.relatedLink || '/notifications');
  };

  useEffect(() => {
    // Fetch count on initial load
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  return (
    <>
      <IconButton color="inherit" onClick={handleClick}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={isOpen}
        onClose={handleClose}
        PaperProps={{
          style: {
            maxHeight: 400,
            width: '350px',
          },
        }}
      >
        <Typography variant="h6" sx={{ p: 2, pb: 1 }}>
          Notifications
        </Typography>
        <Divider />
        {loading ? (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress />
          </Box>
        ) : notifications.length === 0 ? (
          <MenuItem onClick={handleClose}>
            <ListItemText primary="No new notifications" />
          </MenuItem>
        ) : (
          <List dense>
            {notifications.map((notif) => (
              <MenuItem
                key={notif._id}
                onClick={() => handleNotificationClick(notif)}
                selected={!notif.isRead}
              >
                <ListItemText
                  primary={notif.message}
                  secondary={new Date(notif.createdAt).toLocaleString()}
                  primaryTypographyProps={{
                    fontWeight: notif.isRead ? 400 : 600,
                    whiteSpace: 'normal',
                  }}
                />
              </MenuItem>
            ))}
          </List>
        )}
        <Divider />
        <MenuItem
          onClick={() => {
            handleClose();
            navigate('/notifications');
          }}
          sx={{ justifyContent: 'center' }}
        >
          <Typography color="primary" variant="body2">
            See all notifications
          </Typography>
        </MenuItem>
      </Menu>
    </>
  );
};

export default NotificationBell;