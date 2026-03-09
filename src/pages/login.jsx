import { Link } from "react-router-dom";
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../api/axios"
import { jwtDecode } from "jwt-decode"
import ForgotPasswordModal from "../components/ForgotPasswordModal"


function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

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
    <div className="w-full flex items-start justify-center  bg-white">
     <div className="w-3/5 banner-bg h-screen  items-center justify-center relative">  
    {/* <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-4 bg-amber-50 bg-opacity-80 p-6 rounded-lg shadow-md">
       <img
          src="https://raw.githubusercontent.com/kphotone-research/Images-kphotone/main/Logo.png"
          alt="Logo"
          style={{ width: 300, height: "auto" }}
          className="mb-4"
        />
      <h3 className="text-xl font-bold mb-2 text-center sm:text-3xl text-black">
      Join Our Research Panel

    </h3>
    <ul className="text-zinc-600 font-medium space-y-2 text-lg md:text-base">
          <li>• 3+ Years of Experience</li>
          <li>• 200+ Projects Completed</li>
          <li>• 50+ Paid Clients Globally</li>
          <li>• 500+ Physician Feedbacks</li>
          <li>• $1M+ Rewards Paid</li>
        </ul>
    </div> */}
  <div className="mb-4 absolute bottom-1 left-5">
   <img src="https://raw.githubusercontent.com/kphotone-research/Images-kphotone/main/Logo.png"
          alt="Logo"
          style={{ width: 250, height: "auto" }}
          />
          <p className="text-left py-4 mt-2 text-md text-gray-400 border-t border-gray-100">
      © 2026 <span className="text-blue-400 font-semibold">Kphotone</span> Research. All rights reserved.
    </p>
    </div>
       
    

      
      </div>
  {/* Container: Max-width 100% on mobile, restricted on desktop */}
  <div className="w-2/5  h-screen md:py-6 px-8 flex flex-col justify-center">
    
    {/* Heading: Smaller on mobile, Larger on Tablet+ */}
    <h3 className="text-2xl font-bold   sm:text-3xl text-black">
      Login to Your Account
    </h3>
    
    {/* Paragraph: Scaled down for mobile */}
   <p className="font-normal mb-8  text-md md:text-base text-gray-600">
     Share their insights and earn rewards.
    </p>

    {/* Layout Switch: Column on mobile, Row on desktop */}
    <div className="w-full max-w-md  bg-white flex flex-col gap-4 items-center ">
        {error && (
          <p className="bg-red-100 w-full p-4 text-lg font-medium text-red-700  py-2 mb-3 text-center rounded">
            {error}
          </p>
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-4 text-lg text-black font-semibold border rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <div className="relative w-full">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-4 text-lg text-black font-semibold border rounded-md focus:ring-2 focus:ring-blue-500 outline-none letter-spacing-1"
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-xl text-gray-500"
          >
            {showPassword ? "👁️" : "🕶️"}
          </span>
        </div>

          
         
        
        <p className="w-full text-right text-lg text-blue-600 cursor-pointer hover:underline " onClick={() => setShowForgotPasswordModal(true)}>
          Forgot Password?
        </p>
        

        <button
          onClick={handleLogin}
          className="w-full bg-blue-800 hover:bg-blue-900 text-white font-semibold py-3 rounded-md transition-colors  text-lg"
        >
          Sign In Account
        </button>

        <p className=" text-center text-2md text-gray-600">
          Don’t have an account?{" "}
          <Link to="/signup" className="text-blue-600 font-medium hover:underline">
            Sign up
          </Link>
        </p>
      </div>

    {/* Footer */}
    {/* <footer className="text-leftpy-4 mt-10 text-md text-gray-400 border-t border-gray-100">
      © 2026 <span className="text-blue-400 font-semibold">Kphotone</span> Research. All rights reserved.
    </footer> */}
  </div>
 {showForgotPasswordModal && (
   <ForgotPasswordModal onClose={() => setShowForgotPasswordModal(false)} />
 )}
</div>
  );
}

export default Login;
