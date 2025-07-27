import React, {useState, useEffect} from "react"
import { generateUniqueId } from "esewajs";
import axios from "axios"
import { payFine, initiateEsewaPayment, esewaPaymentStatus } from "../../http";

import { toast } from "react-hot-toast";
import { Modal, Pagination } from "../../components";
import { Link, useNavigate } from "react-router-dom";
import { formatDate } from "../../utils/formatDate";


const Test = () => {
  const [amount, setAmount] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showFineModal, setShowFineModal] = useState(false);
  const navigate = useNavigate();

  const onPayFine = (e) => {
      e.preventDefault();
      const promise = payFine({
        transactionID: selectedTransaction._id,
      });
      toast.promise(promise, {
        loading: "Paying...",
        success: (data) => {
          setSelectedTransaction(false);
          fetchData();
          setShowFineModal(false);
          return "Fine paid successfully..";
        },
        error: (err) => {
          console.log();
          return err?.response?.data?.message || "Something went wrong !";
        },
      });
    };

  const handleEsewaPayment = async () => {
  if (!selectedTransaction) {
    toast.error("No transaction selected");
    return;
  }

  try {
    const response = await axios.post('/api/transactions/pay-fine-esewa"', {
      transactionID: selectedTransaction._id
    });
    
    window.location.href = response.data.url;
  } catch (error) {
    toast.error(error.response?.data?.message || "Payment initiation failed");
  }
};

  return (
    <div>
      <h1>eSewa Payment Integration</h1>

      <div className="form-container" onSubmit={handleEsewaPayment}>
        <form className="styled-form" action="https://rc-epay.esewa.com.np/api/epay/main/v2/form"
    method="POST"
    target="_blank">
          <div className="form-group">
            <label htmlFor="Amount">Amount:</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              placeholder="Enter amount"
            />
          </div>

          <button type="submit" className="submit-button" onClick={handleEsewaPayment}>
            Pay with eSewa
          </button>
        </form>
      </div>
    </div>
  );
};

export default Test