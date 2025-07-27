import React, { useEffect, useState } from "react";
import { getBorrowedBooks, renewBookRequest } from "../../http";
import { formatDate } from "../../utils/formatDate";
import Modal from "../../components/dashboard/modal/Modal";
import toast from "react-hot-toast";
import { payFine } from "../../http";
import { Link, useNavigate } from "react-router-dom";
import { Pagination } from "../../components"

const columns = [
  "Course",
  "Title",
  "Author",
  "Borrowed Date",
  "Due Date",
  "Days Left",
  "Renew Status",
  "Fine",
  "Fine Status",
  "Actions"
];

function calculateDaysLeft(dueDateISO) {
  const dueDate = new Date(dueDateISO);
  const currentDate = new Date();

  const timeDifference = dueDate - currentDate;

  const daysDifference = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

  if (daysDifference > 0) {
    return `${daysDifference} days left`;
  } else if (daysDifference === 0) {
    return "Due today";
  } else {
    return `${Math.abs(daysDifference)} days overdue`;
  }
}

const BorrowedBooks = () => {
  const [query, setQuery] = useState({ ISBN: "", rollNumber: "", email: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [data, setData] = useState({});
  const [isFirstRender, setIsFirstRender] = useState(true);
  const navigate = useNavigate();
  const [books, setBooks] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showFineModal, setShowFineModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  const fetchBorrowedBooks = async () => {
    try {
      const { data } = await getBorrowedBooks();
      // console.log(data?.borrowedBooks);
      setBooks(data?.borrowedBooks);
    } catch (error) {
      console.log(error);
    }
  };

  const handleRenewRequest = (e) => {
    e.preventDefault();
    const promise = renewBookRequest({
      transactionID: selectedTransaction,
      renewalDays: e.target.renewalDays.value,
    });
    toast.promise(promise, {
      loading: "Loading...",
      success: (response) => {
        const updatedBookData = response.data.transaction;
        console.log(updatedBookData);
        // Update the book in state
        setBooks((prevBooks) => {
          const bookIndex = prevBooks.findIndex(
            (book) => book._id === updatedBookData._id
          );
          prevBooks[bookIndex] = updatedBookData;
          return [...prevBooks];
        });
        console.log(books);
        e.target.renewalDays.value = "";
        setShowModal(false);
        return "Request sends successfully! We sends mail to update you.";
      },
      error: (err) => {
        console.log(err);
        return err?.response?.data?.message || "Something went wrong !";
      },
    });
  };

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

  const onBookReturn = (selectedRow) => {
    
    /* CHECK FINE PAID OR NOT */
    console.log(selectedRow?.isPaid);
    console.log(selectedRow?.fine);
    console.log(selectedRow);
    if ((selectedRow?.fine == 0) || selectedRow?.isPaid) {
      const promise = ReturnBook({
        transactionID: selectedRow._id,
      });
      toast.promise(promise, {
        loading: "returning...",
        success: (data) => {
          fetchData();
          return "Book Returned  successfully..";
        },
        error: (err) => {
          console.log(err);
          return err?.response?.data?.message || "Something went wrong !";
        },
      });
    } else {
      toast.error("Please pay fine first !");
    }
  };

  useEffect(() => {
    fetchBorrowedBooks();
  }, []);

  const closeFineModal = () => {
    setShowFineModal(false);
    setSelectedTransaction({});
  };
  return (
    <div className="datalist__wrapper">
      <h2>Borrowed Books</h2>
      <span>List of borrowed books</span>

      <div className="table__wrapper bg__accent">
        <table cellSpacing="0" cellPadding="0">
          <thead>
            <tr className="bg__secondary">
              <td>S.N.</td>
              {columns?.map((column) => {
                return <td key={column}>{column}</td>;
              })}
            </tr>
          </thead>
          <tbody>
            {books?.map((item, index) => {
              return (
                <tr key={item._id}>
                  <td>{index + 1}</td>
                  <td>{item?.book?.ISBN}</td>
                  <td>{item?.book?.title}</td>
                  <td>{item?.book?.author}</td>
                  <td>{formatDate(item?.borrowDate)}</td>
                  <td>{formatDate(item?.dueDate)}</td>
                  <td>{calculateDaysLeft(item?.dueDate)}</td>
                  <td>
                    {item?.renewStatus === "None" ? (
                      <button
                        className="btn btn__secondary"
                        onClick={() => {
                          setShowModal(true);
                          setSelectedTransaction(item._id);
                        }}
                      >
                        RENEW
                      </button>
                    ) : (
                      <span
                        className={`badge ${
                          item?.renewStatus === "Pending"
                            ? "badge__warning"
                            : item?.renewStatus === "Rejected"
                            ? "badge__danger"
                            : "badge__success"
                        }`}
                      >
                        {item?.renewStatus}
                      </span>
                    )}
                  </td>

                  {/* <td>
                    <button
                      className="btn btn__secondary"
                      disabled={index.fine <= 0 || index.isPaid}
                      onClick={() => {
                        setShowFineModal(true);
                        setSelectedTransaction(index);
                      }}
                    >
                      Pay Fine
                    </button>
                  </td> */}

                  <td>
                    <span
                      className={`badge badge__sm ${
                        index.fine > 0 ? "badge__success" : "badge__danger"
                      }`}
                    >
                      {item.fine}
                    </span>
                  </td>
                  <td>
                    {item.fine <= 0 ? (
                      <span>-</span>
                    ) : item.isPaid ? (
                      <span>Paid</span>
                    ) : (
                      <span>Not Paid</span>
                    )}
                  </td>
                  
                  <td>
                    <button
                      className="btn btn__secondary"
                      disabled={item.fine <= 0 || item.isPaid}
                      onClick={() => {
                        setShowFineModal(true);
                        setSelectedTransaction(item);
                        navigate('/user/dashboard/payment')
                      }}
                    >
                      Pay Fine
                    </button>
                    {/* <button
                      className="btn btn__primary"
                      onClick={() => {
                        onBookReturn(item);
                      }}
                    >
                      Return
                    </button> */}
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL FOR RENEW */}
      <Modal
        show={showModal}
        title={"Renew Book"}
        onClose={() => {
          setShowModal(false);
        }}
      >
        <form onSubmit={handleRenewRequest}>
          <div className="form-control">
            <label htmlFor="renewalDays">Select Days</label>
            <select
              name="renewalDays"
              id="renewalDays"
              required
              className="bg text__color"
            >
              <option value="">How many days you want to renew book</option>
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
              <option value={6}>6</option>
              <option value={7}>7</option>
            </select>
          </div>
          <div className="actions">
            <button
              className="btn btn__danger"
              type="button"
              onClick={() => {
                setShowModal(false);
              }}
            >
              CANCEL
            </button>
            <button type="submit" className="btn btn__success">
              SEND
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BorrowedBooks;


// import React, { useEffect, useState } from "react";
// import { getBorrowedBooks, renewBookRequest, getAllIssuedBooks } from "../../http";
// import { formatDate } from "../../utils/formatDate";
// import Modal from "../../components/dashboard/modal/Modal";
// import toast from "react-hot-toast";
// import { payFine } from "../../http";
// import { Link, useNavigate } from "react-router-dom";
// import { Pagination } from "../../components"

// const BorrowedBooks = () => {
//   const [query, setQuery] = useState({ ISBN: "", rollNumber: "", email: "" });
//   const [currentPage, setCurrentPage] = useState(1);
//   const [data, setData] = useState({});
//   const [isFirstRender, setIsFirstRender] = useState(true);
//   const navigate = useNavigate();
//   const [showFineModal, setShowFineModal] = useState(false);
//   const [selectedTransaction, setSelectedTransaction] = useState(null);

//   const handleExport = () => {
//     const promise = exportBooks();
//     toast.promise(promise, {
//       loading: "Exporting...",
//       success: (response) => {
//         window.open(response?.data?.downloadUrl);
//         return "Books Exported successfully";
//       },
//       error: (err) => {
//         console.log(err);
//         return "Something went wrong while exporting data.";
//       },
//     });
//   };

//   const fetchData = async () => {
//     try {
//       const { data } = await getAllIssuedBooks(query, currentPage);
//       console.log(data);
//       setData(data);
//     } catch (error) {
//       console.log(error);
//     }
//   };

//   /* FETCH DATA WHEN QUERIES CHANGE */

//   useEffect(() => {
//     if (isFirstRender) {
//       setIsFirstRender(false);
//       return;
//     }
//     setCurrentPage(1);
//     // debouncing
//     const handler = setTimeout(() => {
//       fetchData();
//     }, 1000);

//     return () => {
//       clearTimeout(handler);
//     };
//   }, [query]);

//   /* FETCH DATA WHEN CURRENT PAGE CHANGE */
//   useEffect(() => {
//     fetchData();
//   }, [currentPage]);

//   const onPayFine = (e) => {
//     e.preventDefault();
//     const promise = payFine({
//       transactionID: selectedTransaction._id,
//     });
//     toast.promise(promise, {
//       loading: "Paying...",
//       success: (data) => {
//         setSelectedTransaction(false);
//         fetchData();
//         setShowFineModal(false);
//         return "Fine paid successfully..";
//       },
//       error: (err) => {
//         console.log();
//         return err?.response?.data?.message || "Something went wrong !";
//       },
//     });
//   };

//   const onBookReturn = (selectedRow) => {
    
//     /* CHECK FINE PAID OR NOT */
//     console.log(selectedRow?.isPaid);
//     console.log(selectedRow?.fine);
//     console.log(selectedRow);
//     if ((selectedRow?.fine == 0) || selectedRow?.isPaid) {
//       const promise = ReturnBook({
//         transactionID: selectedRow._id,
//       });
//       toast.promise(promise, {
//         loading: "returning...",
//         success: (data) => {
//           fetchData();
//           return "Book Returned  successfully..";
//         },
//         error: (err) => {
//           console.log(err);
//           return err?.response?.data?.message || "Something went wrong !";
//         },
//       });
//     } else {
//       toast.error("Please pay fine first !");
//     }
//   };

//   const closeFineModal = () => {
//     setShowFineModal(false);
//     setSelectedTransaction({});
//   };

//   return (
//     <div className="manage__section bg">
//       <div className="header">
//         <h2>Books Information</h2>
//       </div>

//       <div className="table__wrapper" style={{ overflow: "auto" }}>
//         <table className="background__accent" cellSpacing="0" cellPadding="0">
//           <thead className="bg__secondary">
//             <tr>
//               <td>ISBN</td>
//               <td>Roll Number/Email</td>
//               <td>Issued Date</td>
//               <td>Due Date</td>
//               <td>Fine</td>
//               <td>Fine Status</td>
//               <td>Actions</td>
//             </tr>
//           </thead>
//           <tbody>
//             {data?.transactionsWithFine?.map((i) => {
//               return (
//                 <tr key={i._id}>
//                   <td>{i.ISBN}</td>
                  
//                   <td>
//                     {i.rollNumber ? (
//                       <span>{i.rollNumber}</span>
//                     ) : (
//                       <span>{i.user?.email}</span>
//                     )}
//                   </td>

//                   <td>{formatDate(i.borrowDate)}</td>
//                   <td>{formatDate(i.dueDate)}</td>
//                   <td>
//                     <span
//                       className={`badge badge__sm ${
//                         i.fine > 0 ? "badge__danger" : "badge__success"
//                       }`}
//                     >
//                       {i.fine}
//                     </span>
//                   </td>
//                   <td>
//                     {i.fine <= 0 ? (
//                       <span>-</span>
//                     ) : i.isPaid ? (
//                       <span>Paid</span>
//                     ) : (
//                       <span>Not Paid</span>
//                     )}
//                   </td>

//                   <td>
//                     <button
//                       className="btn btn__secondary"
//                       disabled={i.fine <= 0 || i.isPaid}
//                       onClick={() => {
//                         setShowFineModal(true);
//                         setSelectedTransaction(i);
//                       }}
//                     >
//                       Pay Fine
//                     </button>
//                     <button
//                       className="btn btn__primary"
//                       onClick={() => {
//                         onBookReturn(i);
//                       }}
//                     >
//                       Return
//                     </button>
//                   </td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>

//       <Pagination
//         currentPage={currentPage}
//         setCurrentPage={setCurrentPage}
//         data={data}
//       />

//       {/* FINE MODAL */}
//       <Modal title="Pay Fine" show={showFineModal} onClose={closeFineModal}>
//         <form onSubmit={onPayFine}>
//           <div className="form-control">
//             <label htmlFor="transaction__id">Transaction ID</label>
//             <input
//               type="text"
//               className="bg"
//               value={selectedTransaction?._id}
//               disabled
//             />
//           </div>
//           <div className="form-control">
//             <label htmlFor="transaction__id">ISBN</label>
//             <input
//               type="text"
//               className="bg"
//               value={selectedTransaction?.ISBN}
//               disabled
//             />
//           </div>
//           <div className="form-control">
//             <label htmlFor="transaction__id">Amount to paid</label>
//             <input
//               type="text"
//               className="bg"
//               value={selectedTransaction?.fine}
//               disabled
//             />
//           </div>
//           <div className="actions">
//             <button
//               className="btn btn__danger"
//               type="button"
//               onClick={closeFineModal}
//             >
//               CANCEL
//             </button>
//             <button type="submit" className="btn btn__success">
//               SUBMIT
//             </button>
//           </div>
//         </form>
//       </Modal>
//     </div>
//   );
// };

// export default BorrowedBooks;
