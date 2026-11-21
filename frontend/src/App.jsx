import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import UploadWaste from "./pages/UploadWaste.jsx";
import AnalysisResult from "./pages/AnalysisResult.jsx";
import SchedulePickup from "./pages/SchedulePickup.jsx";
import Profile from "./pages/Profile.jsx";
import EcoPoints from "./pages/EcoPoints.jsx";

function Layout() {
  return (
    <>
      <Navbar />
      <main className="page-main">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload" element={<UploadWaste />} />
          <Route path="/analysis/:id" element={<AnalysisResult />} />
          <Route path="/schedule-pickup" element={<SchedulePickup />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/eco-points" element={<EcoPoints />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
