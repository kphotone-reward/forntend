import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { useEffect } from "react";

// You can replace this with your actual API instance if you have one set up
import api from "../api/axios";

const Signup = () => {
  const navigate = useNavigate(); // Add navigate hook

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    password: "",
    speciality: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility
  const [specialityInput, setSpecialityInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
  if (specialityInput.length > 1) {
    fetchSuggestions();
  } else {
    setSuggestions([]);
  }
}, [specialityInput]);


const fetchSuggestions = async () => {
  const res = await api.get("/specialities", {
    params: { search: specialityInput }
  });
 setSuggestions(res.data.specialities);
};


  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone" && value.length > 10) {
      return; // Prevent input longer than 10 digits
    }

    setForm({
      ...form,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
        // await axios.post(`${import.meta.env.VITE_API_URL}/auth/signup`, form);
        await api.post(`/auth/signup`, form);

        setMessage("Signup successful. Redirecting to login...");
        setForm({
            name: "",
            email: "",
            phone: "",
            country: "",
            password: "",
            speciality: "",
        });

        setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
        //"ERROR:", err);
        if (err.response && err.response.data && err.response.data.message) {
            setMessage(err.response.data.message);

            // Auto-refresh the page after a few seconds if email already exists
            if (err.response.data.message.includes("Email already exists")) {
                setTimeout(() => window.location.reload(), 3000); // Refresh after 3 seconds
            }
        } else {
            setMessage("Signup failed");
        }
    } finally {
        setLoading(false);
    }
  };

  


  return (
   <div className="w-full flex items-start justify-start ">
   <div className="w-3/5 banner-bg h-screen  items-center justify-center relative sm:flex hidden"> 
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
  {/* Added max-width and removed fixed space-x to prevent mobile overflow */}
 <div className="w-2/5  h-screen md:py-6 px-8 flex flex-col justify-center w-full max-w-md">
   <img src="https://raw.githubusercontent.com/kphotone-research/Images-kphotone/main/Logo.png"
          alt="Logo" className="md:hidden sm:block text-center mb-2"
          style={{ width: 250, height: "auto" }}
          />
    
    {/* Responsive Heading: smaller on mobile */}
   <h3 className="text-2xl font-bold   sm:text-3xl text-black">
      Join Our Research Panel
    </h3>
    <p className="font-normal mb-4 text-md md:text-base text-gray-600">
      Share their insights and earn rewards.
    </p>
    

     <form
        onSubmit={handleSubmit}
        className="w-full max-w-md  bg-white flex flex-col gap-3 "
      >
        {message && (
          <p className={`p-2 text-center rounded text-sm ${
            message.includes("successful") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}>
            {message}
          </p>
        )}

        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={form.name}
          onChange={handleChange}
          required
          className="w-full p-3 text-2md  text-black font-semibold border rounded focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          className="w-full p-3 text-2md border  text-black font-semibold rounded focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <div className="relative">
        
  <input
    type="text"
    placeholder="Enter your speciality"
    value={specialityInput}
    onChange={(e) => {
      setSpecialityInput(e.target.value);
      setForm({ ...form, speciality: e.target.value });
    }}
    className="w-full p-3 text-2md border  text-black font-semibold border-gray-300 rounded focus:outline-none focus:border-blue-500"
    required
  />

  {suggestions.length > 0 && (
    <ul className="absolute w-full bg-white border border-gray-200 rounded mt-1 max-h-40 overflow-y-auto shadow z-20">
      {suggestions.map((s) => (
        <li
          key={s._id}
          onClick={() => {
            setSpecialityInput(s.name);
            setForm({ ...form, speciality: s.name });
            setSuggestions([]);
          }}
          className="p-3 text-2md  text-black font-semibold hover:bg-gray-100 cursor-pointer "
        >
          {s.name}
        </li>
      ))}
    </ul>
  )}
</div>
<input
              type="text"
              name="phone"
              placeholder="Phone Number"
              value={form.phone}
              onChange={handleChange}
              required
              className="w-full p-3 text-2md  text-black font-semibold border rounded focus:ring-2 focus:ring-blue-500 outline-none"
            />

             <input
              type="text"
              name="country"
              placeholder="Country"
              value={form.country}
              onChange={handleChange}
              required
              className="w-full p-3 text-2md  text-black font-semibold border rounded focus:ring-2 focus:ring-blue-500 outline-none"
            />
     

        <div className="relative w-full">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full p-3 text-2md  text-black font-semibold border rounded focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
             className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-xl text-gray-500"
          >
            {showPassword ? "👁️" : "🕶️"}
          </span>
        </div>

        <button
          type="submit"
          disabled={loading || !form.name || !form.email ||!form.speciality || !form.phone || !form.country || !form.password}
          className={`w-full py-3 rounded font-semibold transition-colors text-2md ${
            loading || !form.name || !form.email || !form.speciality || !form.phone || !form.country || !form.password
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-800 text-white hover:bg-blue-900"
          }`}
        >
          {loading ? "Creating..." : "Create Account"}
        </button>

        <p className=" text-center text-2md text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 font-medium hover:underline">
            Login
          </Link>
        </p>
      </form>

    

    {/* Footer */}
    {/* <footer className="text-left py-4 mt-2 text-md text-gray-400 border-t border-gray-100">
      © 2026 <span className="text-blue-400 font-semibold">Kphotone</span> Research. All rights reserved.
    </footer> */}
  </div>
</div>
  );
};

export default Signup;
