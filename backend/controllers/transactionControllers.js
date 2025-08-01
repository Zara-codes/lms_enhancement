import {
  NUMBER_OF_BOOKS_ALLOWED_TO_HOD,
  NUMBER_OF_BOOKS_ALLOWED_TO_STUDENT,
  NUMBER_OF_BOOKS_ALLOWED_TO_TEACHER,
  NUMBER_OF_DAYS_OF_STUDENT,
  NUMBER_OF_DAYS_OF_TEACHER_OR_HOD,
  NUMBER_OF_RESERVED_BOOKS_ALLOW_TO_HOD,
  NUMBER_OF_RESERVED_BOOKS_ALLOW_TO_STUDENT,
  NUMBER_OF_RESERVED_BOOKS_ALLOW_TO_TEACHER,
} from "../config/index.js";

import BookModel from "../models/book-model.js";
import EBookModel from "../models/ebook-model.js";
import {
  FineModel,
  ReservationModel,
  TransactionModel,
  PayFineModel
} from "../models/transaction-models.js";
import { EsewaPaymentGateway, EsewaCheckStatus } from "esewajs";

import UserModel from "../models/user-model.js";
import {
  ErrorHandlerService,
  calculateFine,
  paginationService,
  sendMail,
} from "../services/index.js";
import {
  issuedBookSchema,
  renewBookSchema,
  renewHandleSchema,
} from "../services/validation-service.js";

class TransactionController {
  async adminDashboardStats(req, res, next) {
    try {
      const currentDate = new Date();
      const [
        numberOfBorrowedBooks,
        numberOfAvailableBooks,
        numberOfEBooks,
        numberOfReservedBooks,
        numberOfTotalBooks,
        last5ReturnedBooks,
        last5IssuedBooks,
      ] = await Promise.all([
        TransactionModel.countDocuments({
          isBorrowed: true,
        }),
        BookModel.countDocuments({ status: "Available", isDeleted: "false" }),
        EBookModel.countDocuments({}),
        ReservationModel.countDocuments({}),
        BookModel.countDocuments({ isDeleted: false }),
        TransactionModel.find({ isBorrowed: false })
          .sort({ returnedDate: -1 })
          .limit(5)
          .populate("user", "name")
          .populate("book", "title ISBN"),
        TransactionModel.find({ isBorrowed: true })
          .sort({ borrowDate: -1 })
          .limit(5)
          .populate("user", "name")
          .populate("book", "title ISBN"),
      ]);

      /* STATUS DISTRIBUTION  */
      const statusCounts = {
        Reserved: numberOfReservedBooks,
        Issued: numberOfBorrowedBooks,
        Available: numberOfAvailableBooks,
      };


      /* NUMBER OF BOOKS PER MONTH IN CURRENT YEAR... */
      const last12MonthsData = {};
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sept",
        "Oct",
        "Nov",
        "Dec",
      ];

      /* INTIALIZED MONTH TO ZERO BY DEFAULT */
      for (let i = 0; i < 12; i++) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth(); // Month is 0-based
        last12MonthsData[`${monthNames[month]} ${year}`] = 0;
        currentDate.setMonth(currentDate.getMonth() - 1);
      }

      // Fetch transactions for the last 12 months
      const transactions12 = await TransactionModel.find({
        borrowDate: {
          $gte: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), // Start of the current month
          $lt: new Date(), // Current date
        },
      }).exec();

      transactions12.forEach((transaction) => {
        const year = transaction.borrowDate.getFullYear();
        const month = transaction.borrowDate.getMonth();
        const key = `${monthNames[month]} ${year}`;
        last12MonthsData[key] = (last12MonthsData[key] || 0) + 1;
      });

      // console.log(last12MonthsData);
      console.log(statusCounts);

      return res.status(200).json({
        numberOfBorrowedBooks,
        numberOfReservedBooks,
        numberOfAvailableBooks,
        numberOfEBooks,
        numberOfTotalBooks,
        statusCounts,
        last12MonthsData,
        last5IssuedBooks,
        last5ReturnedBooks,
      });
    } catch (error) {
      next(error);
    }
  }
  /* FOR ADMIN */
  async issuedBook(req, res, next) {
    /* REQUEST VALIDATION */
    const { error } = issuedBookSchema.validate(req.body);
    if (error) {
      return next(error);
    }
    /* CHECK USER IS VALID OR NOT */
    try {
      const user = await UserModel.findById(req.body.userID);
      if (!user) {
        return next(ErrorHandlerService.notFound("User Not Found"));
      }
      const book = await BookModel.findById(req.body.bookID);
      if (!book) {
        return next(ErrorHandlerService.notFound("Book Not Found"));
      }

      /* CHECK BOOK STATUS IS ISSUED OR LOST */
      if (book.status === "Issued" || book.status === "Lost") {
        return next(
          ErrorHandlerService.badRequest(
            `${book.status === "Issued"
              ? "OOPS ! Book is already Issued"
              : "OOPS ! This book is lost!"
            }`
          )
        );
      }

      if (book.status === "Reserved") {
        const reservedBook = await ReservationModel.findOne({
          book: book._id,
        }).populate("user");

        if (user.email === reservedBook?.user?.email) {

          await reservedBook.deleteOne();
        } else {
          return next(
            ErrorHandlerService.badRequest("Book Reserved by someone !")
          );
        }
      }

      /* SET DUE DATE ACCORDING TO USER ROLE : STUDENT ALLOW 7 DAYS AND TEACHERS ALLOW 10 DAYS */
      const currentDate = new Date();
      const dueDate = new Date(currentDate);
      dueDate.setDate(
        currentDate.getDate() +
        (user.role === "Student"
          ? NUMBER_OF_DAYS_OF_STUDENT
          : NUMBER_OF_DAYS_OF_TEACHER_OR_HOD)
      );

      /* ISSUED BOOK */
      const transaction = new TransactionModel({
        user: user._id,
        book: book._id,
        ISBN: book.ISBN,
        userEmail: user.email,
        rollNumber: user?.rollNumber,
        dueDate,
      });
      await transaction.save();
      /* CHANGE STAUTUS OF BOOK  */
      book.status = "Issued";
      await book.save();
      return res.status(200).json({ msg: "Book Issued Successfully !" });
    } catch (error) {
      next(error);
    }
  }


  async userInfo(req, res, next) {
    /* SEARCH BY EMAIL OR ROLL NUMBER */
    const { qEmail, qRollNumber } = req.query;
    let user;
    try {
      if (qRollNumber) {
        user = await UserModel.findOne(
          { rollNumber: qRollNumber },
          "-__v -password -batch -departement"
        );
      }
      if (qEmail) {
        user = await UserModel.findOne(
          { email: qEmail },
          "-__v -password -batch -departement"
        );
      }
      if (!user) {
        return next(ErrorHandlerService.notFound("User Not Found"));
      }

      const borrowedBooks = await TransactionModel.find(
        {
          user: user._id,
          isBorrowed: true,
        },
        "book borrowDate"
      ).populate("book", "ISBN title ");

      const numberOfBorrowedBooks = borrowedBooks.length;
      const maxBooksAllowed = {
        Student: NUMBER_OF_BOOKS_ALLOWED_TO_STUDENT,
        Teacher: NUMBER_OF_BOOKS_ALLOWED_TO_TEACHER,
        HOD: NUMBER_OF_BOOKS_ALLOWED_TO_HOD,
      };
      let hasExceededLimit;
      if (user.role in maxBooksAllowed) {
        hasExceededLimit = numberOfBorrowedBooks >= maxBooksAllowed[user.role];
      } else {
        return next(
          ErrorHandlerService.forbidden("Not Allowed to borrow book")
        );
      }

      return res.status(200).json({
        user,
        borrowedBooks,
        numberOfBorrowedBooks,
        hasExceededLimit,
        maxBooksAllowed: maxBooksAllowed[user.role],
      });
    } catch (error) {
      next(error);
    }
  }
  /* SEARCH BOOKS BY ISBN  */
  async bookInfo(req, res, next) {
    const { qISBN } = req.query;
    try {
      const book = await BookModel.findOne(
        { ISBN: qISBN },
        "ISBN status title author"
      );
      if (!book) {
        return next(ErrorHandlerService.notFound("Book Not Found"));
      }
      /* CHECK IF BOOK IS RESERVED */
      let reservedAlready;
      if (book.status === "Reserved") {
        reservedAlready = await ReservationModel.findOne({
          book: book._id,
        }).populate("user", "email");
      }

      return res.status(200).json({
        book,
        reservedAlready,
      });
    } catch (error) {
      return next(error);
    }
  }

  async returnBook(req, res, next) {

    const { transactionID } = req.body;
    if (!transactionID) {
      return next(
        ErrorHandlerService.validationError("Transaction is required.")
      );
    }
    try {
      const transaction = await TransactionModel.findOne({
        _id: transactionID,
      });
      if (!transaction) {
        return next(ErrorHandlerService.notFound("Transaction not found"));
      }


      /* Update TRANSACTION */
      transaction.isBorrowed = false;
      transaction.returnedDate = new Date();
      await transaction.save();
      /* ALSO CHANGED BOOK STATUS FROM ISSUED TO AVAILABE */
      await BookModel.findByIdAndUpdate(transaction.book, {
        status: "Available",
      });

      return res.status(200).json({ msg: "Book Returned Successfully !" });
    } catch (error) {
      return next(error);
    }
  }

  async payFine(req, res, next) {
    const { transactionID } = req.body;
    if (!transactionID) {
      return next(
        ErrorHandlerService.validationError("Transaction is required.")
      );
    }
    try {
      const transaction = await TransactionModel.findOne({
        _id: transactionID,
      });
      if (!transaction) {
        return next(ErrorHandlerService.notFound("Transaction not found"));
      }
      /* UPDATE FINE  */
      transaction.isPaid = true;
      await transaction.save();

      /* ALSO SAVE INTO DB */

      await FineModel.create({
        transaction: transactionID,
        fine: transaction.fine,
      });

      res.status(200).json({ msg: "Fine paid successfully." });
    } catch (error) {
      next(error);
    }
  }

  // Payment Integration
  async EsewaInitiatePayment(req, res) {
    const { transactionID } = req.body
    const { amount, productId } = req.body;  //data coming from frontend
    try {
      const transaction = await TransactionModel.findOne({
        _id: transactionID
      })

      if(!transaction) {
        return res.status(400).json("Transaction data does not exist")
      }

      const amount = transaction.fine
      const product_id = generateUniqueId()
      const reqPayment = await EsewaPaymentGateway(
        amount, 
        0,
        0, 
        0, 
        productId, 
        process.env.MERCHANT_ID, 
        process.env.SECRET, 
        process.env.SUCCESS_URL, 
        process.env.FAILURE_URL, 
        process.env.ESEWAPAYMENT_URL, 
        undefined, undefined)
      if (!reqPayment ) {
        return res.status(400).json("error sending data")

      }
      if (reqPayment.status === 200) {
        const transaction = new Transaction({
          product_id: productId,
          amount: amount,
        });
        await transaction.save();
        console.log("transaction passed   ")
        return res.send({
          url: reqPayment.request.res.responseUrl,
        });
      }
    }
    catch (error) {
      return res.status(400).json("error sending data")

    }
  }

  async paymentStatus(req, res) {
    const { product_id } = req.body; // Extract data from request body
    try {
      // Find the transaction by its signature
      const transaction = await Transaction.findOne({ product_id });
      if (!transaction) {
        return res.status(400).json({ message: "Transaction not found" });
      }

      const paymentStatusCheck = await EsewaCheckStatus(transaction.amount, transaction.product_id, process.env.MERCHANT_ID, process.env.ESEWAPAYMENT_STATUS_CHECK_URL)



      if (paymentStatusCheck.status === 200) {

        transaction.status = paymentStatusCheck.data.status;
        await transaction.save();
        return res
          .status(200)
          .json({ message: "Transaction status updated successfully" });
      }
    } catch (error) {
      console.error("Error updating transaction status:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };
  // End

  
  async getReservedBooks(req, res, next) {
    const { page, limit, skip } = paginationService(req);
    let totalPages;
    try {
      const books = await ReservationModel.find()
        .sort({ date: -1 })
        .populate("user", "name email")
        .populate("book", "ISBN title author")
        .skip(skip)
        .limit(limit);

      const totalRecords = await ReservationModel.countDocuments();
      totalPages = Math.ceil(totalRecords / limit);
      return res
        .status(200)
        .json({ books, page, limit, totalRecords, totalPages });
    } catch (error) {
      next(error);
    }
  }

  async getIssuedBooks(req, res, next) {
    const { page, limit, skip } = paginationService(req);
    const { rollNumber, email, ISBN } = req.query;
    const filter = {
      isBorrowed: true,
      ...(rollNumber !== "" && { rollNumber }),
      ...(email !== "" && { userEmail: email }),
      ...(ISBN !== "" && { ISBN }),
    };
    let totalPages;
    try {
      const transactions = await TransactionModel.find(
        filter,
        "-createdAt -updatedAt"
      )
        .populate("user", "name email")
        .populate("book", "ISBN title author")
        .skip(skip)
        .limit(limit);
      const totalRecords = await TransactionModel.countDocuments(filter);
      totalPages = Math.ceil(totalRecords / limit);

      /* CALCULATE FINE OF EACH TRANSACTION */
      const transactionsWithFine = await Promise.all(
        transactions.map(async (transaction) => {
          const { fine } = calculateFine(transaction.dueDate, new Date());


          if (fine > 0 && transaction.fine !== fine) {
            await TransactionModel.findByIdAndUpdate(transaction._id, {
              fine: fine,
            });
          }

          return { ...transaction.toObject(), fine };
        })
      );

      return res
        .status(200)
        .json({ transactionsWithFine, page, limit, totalRecords, totalPages });
    } catch (error) {
      next(error);
    }
  }

  async getReturnedBooks(req, res, next) {
    const { page, limit, skip } = paginationService(req);
    let totalPages;
    try {
      const books = await TransactionModel.find({ isBorrowed: false })
        .populate("user", "name email")
        .populate("book", "ISBN title author")
        .skip(skip)
        .limit(limit);
      const totalRecords = await TransactionModel.countDocuments({
        isBorrowed: false,
      });
      totalPages = Math.ceil(totalRecords / limit);
      return res
        .status(200)
        .json({ books, page, limit, totalRecords, totalPages });
    } catch (error) {
      next(error);
    }
  }

  /* GET ALL PENDING REQUEST */
  async getRenewRequests(req, res, next) {
    try {
      const renewRequests = await TransactionModel.find({
        renewStatus: "Pending",
        isBorrowed: true,
      })
        .populate("user", "name email")
        .populate("book", "title");
      return res.status(200).json({ renewRequests });
    } catch (error) {
      next(error);
    }
  }

  /* REJECT OR ACCEPT RENEW REQUEST */
  async hanldeRenewRequest(req, res, next) {
    const { transactionID, renewalStatus } = req.body;
    /* VALIDATE */
    const { error } = renewHandleSchema.validate(req.body);
    if (error) {
      return next(error);
    }

    try {
      /* GET TRANSACTION BY ID */
      const transaction = await TransactionModel.findById(transactionID)
        .populate("user")
        .populate("book");
      if (!transaction) {
        return next(ErrorHandlerService.notFound("Transaction not found !"));
      }

      if (renewalStatus === "Accepted") {
        /* INCREASE DUE DATE */
        const currentDueDate = transaction.dueDate;
        const newDueDate = new Date(currentDueDate);
        newDueDate.setDate(newDueDate.getDate() + transaction.renewalDays);

        transaction.dueDate = newDueDate;
        transaction.renewStatus = "Accepted";
      } else {
        transaction.renewStatus = "Rejected";
      }

      await transaction.save();

      /* SENDING MAIL TO USE TO INFORM  */
      await sendMail({
        to: transaction.user.email,
        subject: "Renewal Request Accepted",
        text: `We hope this email finds you well. We wanted to inform you about the status of your recent renewal request for the book titled ${transaction.book.title
          }.
        ${renewalStatus === "Accepted"
            ? `Your renewal request has been accepted, and your new due date is ${transaction.dueDate}.`
            : `We regret to inform you that your renewal request has been rejected.`
          }

        Thank you for using our library services.

        Best regards,
        GDC Library Management System Admin
          `,
      });

      return res.status(200).json({ message: "Processed Successfully !" });
    } catch (error) {
      next(error);
    }
  }


  async userDashboardStats(req, res, next) {
    try {
      const { _id: userID } = req.userData;
      const currentDate = new Date();
      const [
        numberOfBorrowedBooks,
        numberOfReturnedBooks,
        numberOfReservedBooks,
        numberOfOverDueBooks,
      ] = await Promise.all([
        TransactionModel.countDocuments({
          isBorrowed: true,
          user: userID,
        }),
        TransactionModel.countDocuments({
          isBorrowed: false,
          user: userID,
        }),
        ReservationModel.countDocuments({
          user: userID,
        }),
        TransactionModel.countDocuments({
          user: userID,
          dueDate: { $lt: currentDate },
          isBorrowed: true,
        }),
      ]);

      /* CATEGORIES DISTRIBUTION  */
      const transactions = await TransactionModel.find({ user: userID })
        .populate("user")
        .populate({
          path: "book",
          populate: {
            path: "category",
            model: "Category",
          },
        })
        .exec();

      const categoryCounts = {};

      transactions.forEach((transaction) => {
        const book = transaction.book;
        if (!book) return;
        console.log(book);

        const category = book.category.name;
        if (category) {
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        }
      });

      console.log(categoryCounts);

      /* NUMBER OF BOOKS PER MONTH IN CURRENT YEAR... */
      const last12MonthsData = {};
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sept",
        "Oct",
        "Nov",
        "Dec",
      ];

      /* INTIALIZED MONTH TO ZERO BY DEFAULT */
      for (let i = 0; i < 12; i++) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth(); // Month is 0-based
        last12MonthsData[`${monthNames[month]} ${year}`] = 0;
        currentDate.setMonth(currentDate.getMonth() - 1);
      }

      // Fetch transactions for the last 12 months
      const transactions12 = await TransactionModel.find({
        user: userID,
        borrowDate: {
          $gte: new Date(currentDate.getFullYear(), currentDate.getMonth(), 1), // Start of the current month
          $lt: new Date(), // Current date
        },
      }).exec();

      transactions12.forEach((transaction) => {
        const year = transaction.borrowDate.getFullYear();
        const month = transaction.borrowDate.getMonth();
        const key = `${monthNames[month]} ${year}`;
        last12MonthsData[key] = (last12MonthsData[key] || 0) + 1;
      });

      console.log(last12MonthsData);

      return res.status(200).json({
        numberOfBorrowedBooks,
        numberOfReservedBooks,
        numberOfReturnedBooks,
        numberOfOverDueBooks,
        categoryCounts,
        last12MonthsData,
      });
    } catch (error) {
      next(error);
    }
  }
  async reservedBook(req, res, next) {
    const { _id, role } = req.userData;
    const { ISBN } = req.body;
    if (!ISBN) {
      return next(ErrorHandlerService.validationError("ISBN is required."));
    }
    try {
      /* CHECK HOW MANY BOOKS STUDENTS ALREADY RESERVED */
      const roleLimits = {
        Student: NUMBER_OF_RESERVED_BOOKS_ALLOW_TO_STUDENT,
        Teacher: NUMBER_OF_RESERVED_BOOKS_ALLOW_TO_TEACHER,
        HOD: NUMBER_OF_RESERVED_BOOKS_ALLOW_TO_HOD,
      };
      const limit = roleLimits[role];
      if (limit === undefined) {
        return next(
          ErrorHandlerService.forbidden("Not allowed to reserve books")
        );
      }
      const numberOfReservedBooks = await ReservationModel.countDocuments({
        user: _id,
      });
      const hasExceededLimit = numberOfReservedBooks >= limit;
      if (hasExceededLimit) {
        return next(
          ErrorHandlerService.badRequest(
            `You already reserved ${numberOfReservedBooks} books and ${role} can only reserve ${limit}`
          )
        );
      }

      /* CHECK BOOK STATUS (ALREADY RESERVED OR ISSUED) */
      const book = await BookModel.findOne({ ISBN: ISBN })
        .populate("category")
        .populate("almirah")
        .populate({
          path: "reviews.user",
          select: "name",
        });
      if (!book) {
        return next(ErrorHandlerService.notFound("Book not found"));
      }
      if (book.status === "Reserved" || book.status === "Issued") {
        return next(
          ErrorHandlerService.forbidden(`Book already ${book.status}.`)
        );
      }

      /* RESERVED BOOK NOW */
      const reservedBook = new ReservationModel({ user: _id, book: book._id });
      await reservedBook.save();
      /* CHANGE STATUS OF BOOK */
      book.status = "Reserved";
      await book.save();

      return res
        .status(201)
        .json({ message: "Book Reserved successfully.", book });
    } catch (error) {
      next(error);
    }
  }

  async getReservedBooksByUser(req, res, next) {
    try {
      const reservedBooks = await ReservationModel.find({
        user: req.userData._id,
      }).populate("book", "title author ISBN publisher edition");
      const numberOfReservedBooks = reservedBooks.length;

      return res.status(200).json({ reservedBooks, numberOfReservedBooks });
    } catch (error) {
      next(error);
    }
  }

  async getBorrowedBooksByUser(req, res, next) {
    try {
      const borrowedBooks = await TransactionModel.find({
        user: req.userData._id,
        isBorrowed: true,
      }).populate("book", "title author ISBN publisher edition");
      const numberOfBorrowedBooks = borrowedBooks.length;

      return res.status(200).json({ borrowedBooks, numberOfBorrowedBooks });
    } catch (error) {
      next(error);
    }
  }

  async getReturnedBooksByUser(req, res, next) {
    try {
      const returnedBooks = await TransactionModel.find({
        user: req.userData._id,
        isBorrowed: false,
      })
        .sort({ returnedDate: -1 })
        .populate("book", "title author ISBN publisher edition returnedDate");

      return res.status(200).json({ returnedBooks });
    } catch (error) {
      next(error);
    }
  }

  async unReservedBook(req, res, next) {
    const { _id } = req.params;
    try {
      const reservationBook = await ReservationModel.findByIdAndDelete(_id);
      console.log(reservationBook);
      if (!reservationBook) {
        return next(ErrorHandlerService.notFound("Transaction not found !"));
      }
      /* CHANGE BOOK STATUS FROM RESERVED TO AVAILABLE */
      const book = await BookModel.findByIdAndUpdate(reservationBook.book, {
        status: "Available",
      });

      const reservedBooks = await ReservationModel.find({
        user: req.userData._id,
      }).populate("book", "title author ISBN publisher edition");

      return res
        .status(200)
        .json({ message: "Book UnReserved Successfully !", reservedBooks });
    } catch (error) { }
  }

  async renewRequest(req, res, next) {
    const { transactionID, renewalDays } = req.body;
    /* Validate renewalDays (between 1-7 days) */
    const { error } = renewBookSchema.validate(req.body);
    if (error) {
      return next(error);
    }
    try {
      /* VALIDATE TRANSACTION */
      const transaction = await TransactionModel.findById(
        transactionID
      ).populate("book");
      if (!transaction) {
        return next(ErrorHandlerService.notFound("Transaction not found...."));
      }

      /*  Check if the transaction has already been renewed or processed  */
      if (
        transaction.renewStatus === "Pending" ||
        transaction.renewStatus === "Rejected" ||
        transaction.renewStatus === "Accepted"
      ) {
        return next(
          ErrorHandlerService.badRequest(
            `Your request is already ${transaction.renewStatus}`
          )
        );
      }

      /* Check if the transaction's due date has passed ....*/
      const currentDate = new Date();
      if (currentDate > transaction.dueDate) {
        return next(
          ErrorHandlerService.badRequest(
            "Cannot renew after the due date has passed"
          )
        );
      }

      /* Update the transaction with the renewal request */
      transaction.renewStatus = "Pending";
      transaction.renewalDays = renewalDays;

      await transaction.save();

      return res.status(200).json({
        message: "Your request has been submitted successfully !",
        transaction,
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new TransactionController();