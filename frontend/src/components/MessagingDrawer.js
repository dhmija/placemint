import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
  Typography,
  IconButton,
  TextField,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import { useAuth } from '../context/AuthContext';
import { getMyConversations, getMessages, sendMessage, markConversationAsRead, getMyProfile, searchProfiles, startConversation } from '../services/api';

const MessagingDrawer = ({ open, onClose, onOpen }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [contactNames, setContactNames] = useState({}); // Map of userId -> name
  const [loading, setLoading] = useState(false);
  const [openNewChatDialog, setOpenNewChatDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const fetchConversations = async () => {
    try {
      const { data } = await getMyConversations();
      setConversations(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch my profile to get my name
  const fetchMyProfile = async () => {
    try {
      const { data } = await getMyProfile();
      if (data && user?.id) {
        setContactNames((prev) => ({ ...prev, [user.id]: data.name || user.email }));
      }
    } catch (err) {
      console.error('Failed to fetch my profile:', err);
    }
  };

  const openConversation = async (conv) => {
    setActiveConv(conv);
    setLoading(true);
    try {
      const { data } = await getMessages(conv._id);
      setMessages(data.messages);
      await markConversationAsRead(conv._id);
      // refresh conversations to reset unread counts
      fetchConversations();
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleSend = async () => {
    if (!text.trim() || !activeConv) return;
    try {
      await sendMessage({
        conversationId: activeConv._id,
        content: text,
        recipientId: activeConv.participantIds.find((id) => id !== user?.id),
      });
      setText('');
      // reload messages
      const { data } = await getMessages(activeConv._id);
      setMessages(data.messages);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length === 0) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data } = await searchProfiles(query);
      setSearchResults(data);
    } catch (err) {
      console.error('Search failed:', err);
      setSearchResults([]);
    }
    setSearching(false);
  };

  const handleStartNewChat = async (selectedProfile) => {
    try {
      // Start conversation with this user
      const { data: conv } = await startConversation(selectedProfile.user);
      
      // Update contact names with selected profile
      setContactNames((prev) => ({ ...prev, [selectedProfile.user]: selectedProfile.name }));
      
      // Refresh conversations to show new one
      fetchConversations();
      
      // Open the new conversation
      openConversation(conv);
      
      // Close dialog
      setOpenNewChatDialog(false);
      setSearchQuery('');
      setSearchResults([]);
    } catch (err) {
      console.error('Failed to start conversation:', err);
    }
  };

  const getSenderName = (senderId) => {
    if (senderId === user?.id) return 'You';
    return contactNames[senderId] || 'User';
  };

  const getConversationTitle = (conv) => {
    // Show the other participant's name
    const otherParticipant = conv.participantIds.find((id) => id !== user?.id);
    return contactNames[otherParticipant] || conv.subject || 'Interview Discussion';
  };

  useEffect(() => {
    if (open) {
      fetchConversations();
      fetchMyProfile();
      if (onOpen) onOpen();
    }
  }, [open]);

  return (
    <>
      <Drawer anchor="right" open={open} onClose={onClose} sx={{ zIndex: 1400 }}>
        <Box sx={{ width: 600, p: 2, display: 'flex', flexDirection: 'column', height: '100vh' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Messages</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton size="small" onClick={() => setOpenNewChatDialog(true)} title="Start new chat">
                <AddIcon />
              </IconButton>
              <IconButton onClick={onClose}>
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flex: 1, overflow: 'hidden' }}>
            {/* Conversations List */}
            <Box sx={{ width: '35%', borderRight: '1px solid #eee', pr: 1, overflow: 'auto' }}>
              <List disablePadding>
                {conversations.length === 0 ? (
                  <Typography variant="body2" sx={{ p: 2, color: 'textSecondary' }}>
                    No conversations yet
                  </Typography>
                ) : (
                  conversations.map((conv) => (
                    <React.Fragment key={conv._id}>
                      <ListItem
                        button
                        onClick={() => openConversation(conv)}
                        selected={activeConv?._id === conv._id}
                        sx={{
                          bgcolor: activeConv?._id === conv._id ? '#f5f5f5' : 'transparent',
                          '&:hover': { bgcolor: '#f9f9f9' },
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {getConversationTitle(conv)}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {conv.lastMessage || 'No messages'}
                            </Typography>
                          }
                        />
                        {conv.unreadCount?.recruiter > 0 || conv.unreadCount?.student > 0 ? (
                          <Box
                            sx={{
                              ml: 1,
                              bgcolor: 'error.main',
                              color: 'white',
                              borderRadius: '50%',
                              width: 24,
                              height: 24,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                            }}
                          >
                            {(conv.unreadCount?.recruiter || 0) + (conv.unreadCount?.student || 0)}
                          </Box>
                        ) : null}
                      </ListItem>
                      <Divider />
                    </React.Fragment>
                  ))
                )}
              </List>
            </Box>

            {/* Chat Area */}
            <Box sx={{ width: '65%', pl: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {activeConv ? (
                <>
                  {/* Messages */}
                  <Box sx={{ flex: 1, overflowY: 'auto', mb: 2, pr: 1 }}>
                    {loading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                        <CircularProgress size={40} />
                      </Box>
                    ) : messages.length === 0 ? (
                      <Typography variant="body2" sx={{ color: 'textSecondary' }}>
                        No messages yet. Start the conversation!
                      </Typography>
                    ) : (
                      messages.map((m) => (
                        <Box key={m._id} sx={{ mb: 2 }}>
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 600,
                              color: 'primary.main',
                              display: 'block',
                              mb: 0.3,
                            }}
                          >
                            {getSenderName(m.senderId)}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              p: 1,
                              bgcolor: m.senderId === user?.id ? '#e3f2fd' : '#f5f5f5',
                              borderRadius: 1,
                              wordWrap: 'break-word',
                              fontWeight: m.isRead ? 400 : 600,
                            }}
                          >
                            {m.content}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'textSecondary', display: 'block', mt: 0.3 }}>
                            {new Date(m.createdAt).toLocaleTimeString()}
                          </Typography>
                        </Box>
                      ))
                    )}
                  </Box>

                  {/* Input */}
                  <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                    <TextField
                      fullWidth
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Type a message..."
                      multiline
                      maxRows={3}
                      variant="outlined"
                      size="small"
                    />
                    <Button variant="contained" onClick={handleSend} sx={{ minWidth: 80 }}>
                      Send
                    </Button>
                  </Box>
                </>
              ) : (
                <Box sx={{ p: 2 }}>
                  <Typography variant="body2" sx={{ color: 'textSecondary' }}>
                    Select a conversation to view messages
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Drawer>

      {/* New Chat Dialog */}
      <Dialog open={openNewChatDialog} onClose={() => setOpenNewChatDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Start New Chat</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            fullWidth
            placeholder="Search by name or company..."
            value={searchQuery}
            onChange={handleSearchChange}
            variant="outlined"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            autoFocus
          />
          {searching && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <CircularProgress size={30} />
            </Box>
          )}
          {searchResults.length > 0 && (
            <List sx={{ mt: 2, maxHeight: 300, overflow: 'auto', border: '1px solid #eee', borderRadius: 1 }}>
              {searchResults.map((profile) => (
                <ListItem
                  key={profile._id}
                  button
                  onClick={() => handleStartNewChat(profile)}
                  sx={{ '&:hover': { bgcolor: '#f5f5f5' } }}
                >
                  <ListItemText
                    primary={profile.name}
                    secondary={`ID: ${profile.user.substring(0, 8)}...`}
                  />
                </ListItem>
              ))}
            </List>
          )}
          {!searching && searchQuery && searchResults.length === 0 && (
            <Typography variant="body2" sx={{ color: 'textSecondary', mt: 2 }}>
              No results found
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewChatDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MessagingDrawer;
