import React, { useState, useEffect } from 'react';
import { IconButton, Badge } from '@mui/material';
import MailIcon from '@mui/icons-material/Mail';
import MessagingDrawer from './MessagingDrawer';
import { getMyConversations } from '../services/api';

const MessagingButton = () => {
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState([]);

  const fetchConversations = async () => {
    try {
      const { data } = await getMyConversations();
      setConversations(data);
    } catch (err) {
      console.error('Failed to fetch conversations', err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const unreadCount = conversations.reduce((acc, c) => {
    // assume user role is student or recruiter; both counts included
    return acc + (c.unreadCount?.student || 0) + (c.unreadCount?.recruiter || 0);
  }, 0);

  return (
    <>
      <IconButton color="inherit" onClick={() => setOpen(true)}>
        <Badge badgeContent={unreadCount} color="error">
          <MailIcon />
        </Badge>
      </IconButton>
      <MessagingDrawer open={open} onClose={() => setOpen(false)} onOpen={() => fetchConversations()} />
    </>
  );
};

export default MessagingButton;
