import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/login"
import ProtectedRoute from "./auth/ProtectedRoute"
import RoleGuard from "./auth/RoleGuard"
import UserDashboard from "./pages/user/Dashboard"
import AdminDashboard from "./pages/admin/Dashboard"
import RedeemPoints from "./pages/user/redeemPoints"
import SurveyPage from "./pages/user/survey"
import Signup from "./pages/signup"



function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<RoleGuard requiredRole="user" />}>
            <Route path="/user/dashboard" element={<UserDashboard />} />
            <Route path="/user/redeemPoints" element={<RedeemPoints />} />
            <Route path="/user/survey" element={<SurveyPage />} />
          </Route>

          <Route element={<RoleGuard requiredRole="admin" />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
