import { Navigate, Outlet } from "react-router-dom"
import { jwtDecode } from "jwt-decode"

function RoleGuard({ requiredRole }) {
  const token = localStorage.getItem("token")

  if (!token) {
    return <Navigate to="/login" replace />
  }

  try {
    const user = jwtDecode(token)

    if (user.role === requiredRole) {
      return <Outlet />
    } else {
      // Redirect to correct dashboard based on role
      const dashboardPath = user.role === "admin" ? "/admin/dashboard" : "/user/dashboard"
      return <Navigate to={dashboardPath} replace />
    }
  } catch (err) {
    return <Navigate to="/login" replace />
  }
}

export default RoleGuard
