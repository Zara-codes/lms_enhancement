// components/NotificationMenu.jsx
import { useState } from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import axios from 'axios';

export default function NotificationMenu({ anchorEl, onClose, notifications }) {
  const [localNotifications, setLocalNotifications] = useState(notifications);

  const handleMarkAsRead = async (id) => {
    try {
      await axios.patch(`/api/notifications/${id}/read`);
      setLocalNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, isRead: true } : n)
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      PaperProps={{
        style: {
          maxHeight: '400px',
          width: '350px'
        }
      }}
    >
      <Typography variant="h6" sx={{ px: 2, py: 1 }}>
        Notifications
      </Typography>
      <Divider />

      {localNotifications.length === 0 ? (
        <MenuItem disabled>No new notifications</MenuItem>
      ) : (
        localNotifications.map(notification => (
          <MenuItem 
            key={notification._id}
            onClick={() => handleMarkAsRead(notification._id)}
            sx={{
              bgcolor: notification.isRead ? 'inherit' : 'action.selected'
            }}
          >
            <div>
              <Typography>{notification.message}</Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(notification.createdAt).toLocaleString()}
              </Typography>
            </div>
          </MenuItem>
        ))
      )}
    </Menu>
  );
}