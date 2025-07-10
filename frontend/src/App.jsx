import React, { useEffect, useState } from "react";
import { Routes, Route, Outlet, Navigate } from "react-router-dom";
import Failure from "./components/payment/Failure.jsx"
import Success from "./components/payment/Success.jsx"
import PaymentForm from "./components/payment/PaymentForm.jsx"
import {
  AboutUs,
  BookDetail,
  BookReader,
  Books,
  ContactUs,
  EBookDetail,
  EBooks,
  EmailSent,
  ForgetPassword,
  Home,
  Login,
  NewPassword,
  WebsiteLayout,
} from "./website";
import {
  AddNewBook,
  AddNewEBook,
  AdminDashboardLayout,
  AdminHome,
  BorrowedBooks,
  ChangePassword,
  ClearanceForm,
  IssueBook,
  ManageAlmirah,
  ManageBatch,
  ManageBook,
  ManageCategory,
  ManageClearanceRequest,
  ManageDepartement,
  ManageEBook,
  ManageIssueBooks,
  ManageMessages,
  ManageRenewRequests,
  ManageStudent,
  ManageTeacher,
  ReservedBookList,
  ReservedBooks,
  ReturnedBookList,
  ReturnedBooks,
  UpdateBook,
  UpdateEBook,
  UserDashboardLayout,
  UserDetail,
  UserHome,
} from "./dashboards";

import { Toaster } from "react-hot-toast";
import { STATUSES, refreshTokens } from "./http";
import { useDispatch } from "react-redux";
import { useSelector } from "react-redux";
import { setAuth } from "./store/slices/authSlice";
import { Profile } from "./components";
import Loader from "./components/website/loader/Loader";
const App = () => {
  const { theme } = useSelector((state) => state.theme);
  const dispatch = useDispatch();
  const [status, setStatus] = useState(STATUSES.IDLE);


  useEffect(() => {
    (async () => {
      try {
        setStatus(STATUSES.LOADING);
        const { data } = await refreshTokens();
        dispatch(setAuth(data));
        setStatus(STATUSES.IDLE);
      } catch (error) {
        setStatus(STATUSES.ERROR);
      }
    })();
  }, []);

  if (status === STATUSES.LOADING) {
    return <Loader />;
  }

  return (
    <div className={`${theme}`}>
      <Routes>

        <Route path="/" element={<WebsiteLayout />}>
          <Route index element={<Home />} />
          <Route path="books" element={<Books />} />
          <Route path="ebooks" element={<EBooks />} />
          <Route path="contact-us" element={<ContactUs />} />
          <Route path="about-us" element={<AboutUs />} />
          <Route path="books/:_id" element={<BookDetail />} />
          <Route path="ebooks/:_id" element={<EBookDetail />} />
        </Route>

        <Route path="/book-reader/uploads/:fileName" element={<BookReader />} />

        <Route path="/login" element={<GuestRoutes />}>
          <Route index element={<Login />} />
        </Route>
        <Route path="/forget-password" element={<ForgetPassword />} />
        <Route path="/email-sent" element={<EmailSent />} />
        <Route path="/new-password/:token" element={<NewPassword />} />


        <Route path="/admin" element={<AdminProtectedRoutes />}>
          <Route path="dashboard" element={<AdminDashboardLayout />}>
            <Route index element={<AdminHome />} />

            <Route path="manage-teachers" element={<ManageTeacher />} />
            <Route path="manage-students" element={<ManageStudent />} />
            <Route path="manage-batches" element={<ManageBatch />} />
            <Route path="manage-departements" element={<ManageDepartement />} />

            <Route path="manage-books" element={<ManageBook />} />
            <Route path="user-details/:_id" element={<UserDetail />} />
            <Route path="book-details/:_id" element={<BookDetail />} />
            <Route path="add-new-book" element={<AddNewBook />} />
            <Route path="update-book/:_id" element={<UpdateBook />} />
            <Route path="manage-categories" element={<ManageCategory />} />
            <Route path="manage-almirahs" element={<ManageAlmirah />} />

            <Route path="manage-ebooks" element={<ManageEBook />} />
            <Route path="add-new-ebook" element={<AddNewEBook />} />
            <Route path="update-ebook/:_id" element={<UpdateEBook />} />
            <Route path="ebook-details/:_id" element={<EBookDetail />} />

            <Route path="manage-issued-books" element={<ManageIssueBooks />} />
            <Route path="issue-book" element={<IssueBook />} />
            <Route path="reserved-books-list" element={<ReservedBookList />} />
            <Route path="returned-books-list" element={<ReturnedBookList />} />
            <Route
              path="manage-renew-requests"
              element={<ManageRenewRequests />}
            />

            <Route path="manage-messages" element={<ManageMessages />} />


            <Route path="profile" element={<Profile />} />
            <Route path="change-password" element={<ChangePassword />} />


            <Route
              path="manage-clearance-form/:status"
              element={<ManageClearanceRequest />}
            />
          </Route>
        </Route>


        <Route path="/user" element={<UserProtectedRoutes />}>
          <Route path="dashboard" element={<UserDashboardLayout />}>
            <Route index element={<UserHome />} />
            <Route path="borrowed-books" element={<BorrowedBooks />} />
            <Route path="reserved-books" element={<ReservedBooks />} />
            <Route path="returned-books" element={<ReturnedBooks />} />
            <Route path="profile" element={<Profile />} />
            <Route path="change-password" element={<ChangePassword />} />
            <Route path="payment" element={<PaymentForm />}>
              <Route path="payment-success" element={<Success />} />
              <Route path="payment-failure" element={<Failure />} />
            </Route>


            <Route
              path="manage-clearance-form/:status"
              element={<ManageClearanceRequest />}
            />

            <Route path="clearance-form" element={<ClearanceForm />} />
          </Route>
        </Route>

      </Routes>

      <Toaster position="top-center" reverseOrder={false} />
    </div>
  );
};

export default App;

export const AdminProtectedRoutes = () => {
  const auth = useSelector((state) => state.auth);
  return auth?.isAuth && auth.user?.role === "Admin" ? (
    <Outlet />
  ) : (
    <Navigate to="/login" />
  );
};

export const UserProtectedRoutes = () => {
  const auth = useSelector((state) => state.auth);
  return auth?.isAuth ? <Outlet /> : <Navigate to="/login" />;
};

export const GuestRoutes = () => {
  const auth = useSelector((state) => state.auth);
  return !auth?.isAuth ? (
    <Outlet />
  ) : auth.user?.role === "Admin" ? (
    <Navigate to="/admin/dashboard" />
  ) : (
    <Navigate to="/user/dashboard" />
  );
};
