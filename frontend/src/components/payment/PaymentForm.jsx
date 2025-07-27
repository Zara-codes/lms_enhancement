import React , { useState } from 'react'
import { generateUniqueId } from "esewajs";
import axios from "axios";
import toast from "react-hot-toast";

const PaymentForm = () => {
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

 const handlePayment = async () => {
  try {
    const response = await axios.post(
      "http://localhost:5000/api/payment/initiate-payment",
      { amount, productId: generateUniqueId() },
      { withCredentials: true }  // This is crucial
    );
    window.location.href = response.data.url;
  } catch (error) {
    if (error.response?.status === 401) {
      // Handle expired session
      window.location.href = "/login?session_expired=true";
    } else {
      toast.error(error.response?.data?.message || "Payment failed");
    }
  }
};

  return (
    <div className="payment-container">
      <div className="payment-card">
        <h1 className="payment-title">eSewa Payment Gateway</h1>
        <p className="payment-subtitle">Enter payment details below</p>
        
        <form onSubmit={handlePayment} className="payment-form">
          <div className="form-group">
            <label htmlFor="amount">Amount (NPR)</label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="Enter amount"
              className="form-input"
              min="1"
            />
          </div>

          <button 
            type="submit" 
            className="submit-button"
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : 'Pay with eSewa'}
          </button>
        </form>

        <div className="payment-security">
          <div className="security-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#4CAF50">
              <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z"/>
            </svg>
            <span>Secure Payment</span>
          </div>
          <div className="payment-methods">
            <img 
              src="https://esewa.com.np/common/images/esewa_logo.png" 
              alt="eSewa" 
              className="payment-logo" 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// CSS Styles (can be in a separate file)
const styles = `
  .payment-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #f5f7fa;
    padding: 20px;
  }
  
  .payment-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    padding: 30px;
    width: 100%;
    max-width: 500px;
  }
  
  .payment-title {
    font-size: 24px;
    color: #333;
    margin-bottom: 8px;
    text-align: center;
  }
  
  .payment-subtitle {
    color: #666;
    text-align: center;
    margin-bottom: 30px;
    font-size: 16px;
  }
  
  .payment-form {
    margin-top: 20px;
  }
  
  .form-group {
    margin-bottom: 20px;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #555;
  }
  
  .form-input {
    width: 100%;
    padding: 12px 15px;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 16px;
    transition: border-color 0.3s;
  }
  
  .form-input:focus {
    outline: none;
    border-color: #4a90e2;
  }
  
  .submit-button {
    width: 100%;
    padding: 15px;
    background-color: #4a90e2;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.3s;
    margin-top: 10px;
  }
  
  .submit-button:hover {
    background-color: #357abD;
  }
  
  .submit-button:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
  
  .payment-security {
    margin-top: 25px;
    padding-top: 20px;
    border-top: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .security-badge {
    display: flex;
    align-items: center;
    color: #4CAF50;
    font-size: 14px;
  }
  
  .security-badge svg {
    margin-right: 8px;
  }
  
  .payment-logo {
    height: 30px;
  }
`;

// Add styles to the document
const styleElement = document.createElement('style');
styleElement.innerHTML = styles;
document.head.appendChild(styleElement);

export default PaymentForm;