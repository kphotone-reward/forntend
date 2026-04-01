import { Navigate, Outlet } from "react-router-dom"
import { jwtDecode } from "jwt-decode"

function RoleGuard({ allowedRoles }) {
  const token = localStorage.getItem("token")

  if (!token) {
    return <Navigate to="/login" replace />
  }

  try {
    const user = jwtDecode(token)

    if (allowedRoles.includes(user.role)) {
      return <Outlet />
    } else {
      // Redirect based on role
      const dashboardPath =
        user.role === "admin" || user.role === "super_admin"
          ? "/admin/dashboard"
          : "/user/dashboard"

      return <Navigate to={dashboardPath} replace />
    }
  } catch (err) {
    return <Navigate to="/login" replace />
  }
}

export default RoleGuard
