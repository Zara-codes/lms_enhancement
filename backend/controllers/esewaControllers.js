// controllers/esewaController.js
const axios = require('axios');

const ESewaConfig = {
  MERCHANT_ID: process.env.ESEWA_MERCHANT_ID,
  SECRET_KEY: process.env.ESEWA_SECRET_KEY,
  BASE_URL: process.env.NODE_ENV === 'production' 
    ? 'https://epay.esewa.com.np' 
    : 'https://rc-epay.esewa.com.np' // Test URL
};

exports.initiatePayment = async (req, res) => {
  const { amount, transactionId, fineId } = req.body;
  
  const payload = {
    amount: amount,
    tax_amount: 0,
    total_amount: amount,
    transaction_uuid: transactionId,
    product_code: 'LIBRARY_FINE',
    product_service_charge: 0,
    product_delivery_charge: 0,
    success_url: `${process.env.FRONTEND_URL}/payment/success?fineId=${fineId}`,
    failure_url: `${process.env.FRONTEND_URL}/payment/failure`,
    signed_field_names: 'total_amount,transaction_uuid,product_code',
  };

  // Generate signature
  const signatureData = `${payload.total_amount},${payload.transaction_uuid},${payload.product_code}`;
  const signature = require('crypto')
    .createHmac('sha256', ESewaConfig.SECRET_KEY)
    .update(signatureData)
    .digest('base64');

  payload.signature = signature;

  res.json({
    url: `${ESewaConfig.BASE_URL}/epay/main`,
    params: payload
  });
};

exports.verifyPayment = async (req, res) => {
  const { data } = req.body;
  
  try {
    const verificationUrl = `${ESewaConfig.BASE_URL}/api/epay/transaction/status`;
    
    const response = await axios.post(verificationUrl, {
      merchant_id: ESewaConfig.MERCHANT_ID,
      transaction_uuid: data.transaction_uuid,
      signed_field_names: 'transaction_uuid,status',
      signature: data.signature
    });

    if (response.data.status === 'COMPLETE') {
      // Update fine status in your database
      return res.json({ success: true, data: response.data });
    }

    res.status(400).json({ success: false, message: 'Payment verification failed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};