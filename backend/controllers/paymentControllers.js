// controllers/paymentController.js
import { Fine } from '../models/transaction.model.js';
import crypto from 'crypto';

const initiateEsewaPayment = async (req, res) => {
  const { fineId } = req.body;
  
  try {
    const fine = await Fine.findById(fineId).populate('transaction');
    
    if (!fine || fine.transaction.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const payload = {
      amount: fine.amount,
      tax_amount: 0,
      total_amount: fine.amount,
      transaction_uuid: `FINE-${Date.now()}-${fine._id}`,
      product_code: 'LIBRARY_FINE',
      success_url: `${process.env.FRONTEND_URL}/payment/success?fineId=${fine._id}`,
      failure_url: `${process.env.FRONTEND_URL}/payment/failure`,
      signed_field_names: 'total_amount,transaction_uuid,product_code',
    };

    // Generate signature
    const signatureData = `${payload.total_amount},${payload.transaction_uuid},${payload.product_code}`;
    payload.signature = crypto
      .createHmac('sha256', process.env.ESEWA_SECRET_KEY)
      .update(signatureData)
      .digest('base64');

    res.json({
      paymentUrl: `${process.env.ESEWA_BASE_URL}/epay/main`,
      params: payload
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const verifyEsewaPayment = async (req, res) => {
  const { data } = req.body;
  const { fineId } = req.query;

  try {
    // Verify signature
    const computedSig = crypto
      .createHmac('sha256', process.env.ESEWA_SECRET_KEY)
      .update(`${data.total_amount},${data.transaction_uuid},${data.product_code}`)
      .digest('base64');

    if (computedSig !== data.signature) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Update fine status
    const fine = await Fine.findByIdAndUpdate(fineId, {
      status: data.status === 'COMPLETE' ? 'PAID' : 'FAILED',
      paymentMethod: 'eSewa',
      paidDate: new Date(),
      receiptNumber: `ESEWA-${data.transaction_uuid}`
    }, { new: true });

    if (!fine) {
      return res.status(404).json({ error: 'Fine not found' });
    }

    // Update transaction
    await Transaction.findByIdAndUpdate(fine.transaction, {
      isPaid: data.status === 'COMPLETE'
    });

    res.json({ success: true, fine });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export { initiateEsewaPayment, verifyEsewaPayment };