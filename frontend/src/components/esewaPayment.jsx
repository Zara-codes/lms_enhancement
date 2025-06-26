// components/EsewaPayment.jsx
import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function EsewaPayment({ amount, fineId }) {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handlePayment = async () => {
    setLoading(true);
    
    try {
      // Generate unique transaction ID
      const transactionId = `LIB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      // Get eSewa payment URL from backend
      const { data } = await axios.post('/api/payment/esewa/initiate', {
        amount,
        transactionId,
        fineId
      });

      // Redirect to eSewa
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = data.url;

      Object.entries(data.params).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value;
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      alert('Payment initiation failed');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handlePayment}
      disabled={loading}
      className="bg-green-600 text-white px-4 py-2 rounded"
    >
      {loading ? 'Processing...' : `Pay via eSewa (Rs. ${amount})`}
    </button>
  );
}