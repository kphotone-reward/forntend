import { Link } from "react-router-dom";
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api/axios"
import { jwtDecode } from "jwt-decode"


function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in both email and password.");
      setTimeout(() => setError(""), 5000); // Clear error after 5 seconds
      return;
    }

    try {
      const res = await api.post(`${import.meta.env.VITE_API_URL}/auth/login`, { email, password });
      const token = res.data.token

      localStorage.setItem("token", token)

      const user = jwtDecode(token)
      console.log("LOGIN BODY:", { email, password });
      console.log("USER FOUND:", user);

      if (user.role === "admin") {
        navigate("/admin/dashboard")
      } else {
        navigate("/user/dashboard")
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed")
      setTimeout(() => setError(""), 5000); // Clear error after 5 seconds
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="p-10 rounded-lg space-x-10">
        <h3 className="text-3xl text-black font-bold mb-2 text-center">
          Join Our Research Panel
        </h3>
        <p className="font-normal mb-5  text-center" style={{"fontSize":"16px"}}>
          A global market research company providing end to end research solutions
        </p>
        <div className="flex items-center" style={{ padding: "40px" }}>
          <div className="flex flex-col items-center mr-10 text-left gap-4">
            <img
              src="https://raw.githubusercontent.com/kphotone-research/Images-kphotone/main/Logo.png"
              alt="Logo"
              style={{ width: 200, height: 50 }}
            />

            <ul
              className="text-zinc-600 font-medium"
              style={{ marginTop: "12px", lineHeight: "1.5" }}
            >
              <li>3+ Years of Experience</li>
              <li>200+ Projects Completed</li>
              <li>50+ Paid Clients Globally</li>
              <li>500+ Physician Feedbacks Collected</li>
              <li>$1M+ Rewards Paid</li>
            </ul>
          </div>
          <div className="w-90 p-6 bg-white flex flex-col gap-3 border border-gray-200 rounded-lg">
            {error && (
              <p className="bg-red-100 text-red-700 text-sm py-2 mb-3 text-center">
                {error}
              </p>
            )}

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mb-4 p-2 border rounded"
            />

            <div className="relative w-full mb-4">
              <input
                type={showPassword ? "text" : "password"} // Toggle input type
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded"
              />
              <span
                onClick={() => setShowPassword(!showPassword)} // Toggle visibility
                className="absolute right-3 top-3 cursor-pointer text-gray-500"
              >
                {showPassword ? "\u{1F441}" : "\u{1F576}"} {/* Eye icon */}
              </span>
            </div>

            <button
              onClick={handleLogin}
              className="w-full bg-blue-800 text-white font-semibold  py-2 rounded"
            >
              Login
            </button>

            <p style={{ marginTop: "12px", textAlign: "center" }}>
              Don’t have an account?{" "}
              <Link to="/signup" style={{ color: "#2563eb" }}>
                Sign up
              </Link>
            </p>
          </div>
        </div>
        <footer className="text-center py-2 mt-4 text-gray-400 border-t border-b-gray-50">
          © 2026 Kphotone Research. All rights reserved.
        </footer>
      </div>
    </div>
  );
}

export default Login;
