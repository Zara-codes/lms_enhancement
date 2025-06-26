// context/socketContext.js
import { createContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const newSocket = io(process.env.REACT_APP_API_URL, {
      reconnectionAttempts: 5,
      reconnectionDelay: 5000
    });

    setSocket(newSocket);

    // Setup listener
    newSocket.on('new_notification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
    });

    return () => newSocket.disconnect();
  }, []);

  return (
    <SocketContext.Provider value={{ socket, notifications, unreadCount }}>
      {children}
    </SocketContext.Provider>
  );
};