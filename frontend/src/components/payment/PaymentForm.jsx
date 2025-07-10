import React, { useState } from 'react';
import axios from 'axios';
import { generateUniqueId } from 'esewajs';
import { toast } from 'react-hot-toast';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  CircularProgress,
  Paper
} from '@mui/material';
import { Payment as PaymentIcon } from '@mui/icons-material';

const PaymentForm = () => {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePayment = async (e) => {
    e.preventDefault();
    
    if (!amount || Number(amount) <= 0) {
      setError('Please enter a valid amount');
      toast.error('Please enter a valid amount');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(
        import.meta.env.VITE_API_URL + '/initiate-payment',
        {
          amount: Number(amount),
          productId: generateUniqueId(),
        }
      );

      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage = error.response?.data?.message || 
                         'Payment initiation failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <PaymentIcon color="primary" sx={{ fontSize: 60 }} />
          <Typography variant="h4" component="h1" gutterBottom>
            Fine Payment
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Pay your library fines securely via eSewa
          </Typography>
        </Box>

        <Box component="form" onSubmit={handlePayment} sx={{ mt: 3 }}>
          <TextField
            fullWidth
            label="Amount (NPR)"
            variant="outlined"
            type="number"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError('');
            }}
            error={!!error}
            helperText={error}
            inputProps={{ min: '1', step: '1' }}
            margin="normal"
            required
          />

          <Button
            fullWidth
            variant="contained"
            size="large"
            type="submit"
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
            sx={{ mt: 3, py: 1.5 }}
          >
            {isLoading ? 'Processing Payment...' : 'Pay with eSewa'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default PaymentForm;