// pages/PaymentSuccess.jsx
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const fineId = searchParams.get('fineId');

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const data = {
          transaction_uuid: searchParams.get('transaction_uuid'),
          signature: searchParams.get('signature'),
          status: searchParams.get('status')
        };

        await axios.post('/api/payment/esewa/verify', { data });
        alert('Payment verified successfully!');
        navigate(`/fines/${fineId}`);
      } catch (err) {
        alert('Payment verification failed');
        navigate('/fines');
      }
    };

    verifyPayment();
  }, []);

  return (
    <div className="p-4">
      <h1>Payment Successful</h1>
      <p>Verifying your payment...</p>
    </div>
  );
}