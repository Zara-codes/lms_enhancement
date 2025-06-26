// pages/PaymentFailure.jsx
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function PaymentFailure() {
  const navigate = useNavigate();

  useEffect(() => {
    alert('Payment failed. Please try again.');
    navigate('/fines');
  }, []);

  return (
    <div className="p-4">
      <h1>Payment Failed</h1>
    </div>
  );
}