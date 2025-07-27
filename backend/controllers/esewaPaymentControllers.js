import { FineModel, PayFineModel } from "../models/transaction-models.js";
import { getEsewaPaymentHash, verifyEsewaPayment } from "../services/esewa.js"

const initiateEsewaPayment =  async (req, res) => {
  try {
    const { itemId, fine } = req.body;

    const itemData = await FineModel.findOne({
      _id: itemId,
      price: Number(fine),
    });

    if (!itemData) {
      return res.status(400).send({
        success: false,
        message: "item not found",
      });
    }
    const PayFineData = await PayFineModel.create({
      item: itemId,
      paymentMethod: "esewa",
      fine: fine,
    });
    const paymentInitate = await getEsewaPaymentHash({
      amount: totalPrice,
      transaction_uuid: purchasedItemData._id,
    });

    res.json({
      success: true,
      payment: paymentInitate,
      purchasedItemData,
    });
  } catch (error) {
    res.json({
      success: false,
      error,
    });
  }
}

const completePayment = async (req, res) => {
  const { data } = req.query;

  try {
    const paymentInfo = await verifyEsewaPayment(data);
    const PayFineData = await PayFineModel.findById(
      paymentInfo.response.transaction_uuid
    );
    if (!PayFineData) {
      res.status(500).json({
        success: false,
        message: "Purchase not found",
      });
    }
    // Create a new payment record
    const paymentData = await Payment.create({
      pidx: paymentInfo.decodedData.transaction_code,
      transactionId: paymentInfo.decodedData.transaction_code,
      fineId: paymentInfo.response.transaction_uuid,
      amount: purchasedItemData.totalPrice,
      dataFromVerificationReq: paymentInfo,
      apiQueryFromUser: req.query,
      paymentGateway: "esewa",
      status: "success",
    });

    //updating purchased record
    await PayFineModel.findByIdAndUpdate(
      paymentInfo.response.transaction_uuid,
      {
        $set: {
          status: "completed",
        },
      }
    );
    // Send success response
    res.json({
      success: true,
      message: "Payment Successful",
      paymentData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred",
      error,
    });
  }
}


export { initiateEsewaPayment, completePayment }