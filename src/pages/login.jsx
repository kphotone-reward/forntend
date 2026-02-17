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
      // const res = await api.post(`${import.meta.env.VITE_API_URL}/auth/login`, { email, password });
       const res = await api.post(`/auth/login`, { email, password });
      const token = res.data.token

      localStorage.setItem("token", token)

      const user = jwtDecode(token)
     // console.log("LOGIN BODY:", { email, password });
     // console.log("USER FOUND:", user);

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
  {/* Container: Max-width 100% on mobile, restricted on desktop */}
  <div className="w-full max-w-4xl bg-white md:p-10 p-6 rounded-lg shadow-sm">
    
    {/* Heading: Smaller on mobile, Larger on Tablet+ */}
    <h3 className="text-xl font-bold mb-2 text-center sm:text-3xl text-black">
      Join Our Research Panel
    </h3>
    
    {/* Paragraph: Scaled down for mobile */}
   <p className="font-normal mb-8 text-center text-sm md:text-base text-gray-600">
      A global market research company providing end to end research solutions
    </p>

    {/* Layout Switch: Column on mobile, Row on desktop */}
    <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-8 md:gap-12">
      
      {/* Left Side: Stats and Logo */}
      <div className="flex flex-col items-center md:items-start text-center md:text-left">
        <img
          src="https://raw.githubusercontent.com/kphotone-research/Images-kphotone/main/Logo.png"
          alt="Logo"
          style={{ width: 180, height: "auto" }}
          className="mb-4"
        />

        <ul className="text-zinc-600 font-medium space-y-2 text-sm md:text-base">
          <li>• 3+ Years of Experience</li>
          <li>• 200+ Projects Completed</li>
          <li>• 50+ Paid Clients Globally</li>
          <li>• 500+ Physician Feedbacks</li>
          <li>• $1M+ Rewards Paid</li>
        </ul>
      </div>

      {/* Right Side: Login Form */}
      <div className="w-full max-w-md p-6 bg-white flex flex-col gap-3 border border-gray-200 rounded-lg shadow-sm">
        {error && (
          <p className="bg-red-100 text-red-700 text-sm py-2 mb-3 text-center rounded">
            {error}
          </p>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <div className="relative w-full">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3 cursor-pointer text-gray-500"
          >
            {showPassword ? "👁️" : "🕶️"}
          </span>
        </div>

        <button
          onClick={handleLogin}
          className="w-full bg-blue-800 hover:bg-blue-900 text-white font-semibold py-2.5 rounded-md transition-colors"
        >
          Login
        </button>

        <p className="mt-3 text-center text-sm text-gray-600">
          Don’t have an account?{" "}
          <Link to="/signup" className="text-blue-600 font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>

    {/* Footer */}
    <footer className="text-center py-4 mt-10 text-xs text-gray-400 border-t border-gray-100">
      © 2026 Kphotone Research. All rights reserved.
    </footer>
  </div>
</div>
  );
}

export default Login;
