
import { useContext, useEffect, useState } from 'react';
import { SocketContext } from '../context/socketContext';
import Badge from '@mui/material/Badge';
import IconButton from '@mui/material/IconButton';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationMenu from './NotificationMenu';

export default function NotificationBell() {
  const { unreadCount, notifications } = useContext(SocketContext);
  const [anchorEl, setAnchorEl] = useState(null);

  return (
    <>
      <IconButton 
        color="inherit"
        onClick={(e) => setAnchorEl(e.currentTarget)}
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <NotificationMenu 
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        notifications={notifications}
      />
    </>
  );
}