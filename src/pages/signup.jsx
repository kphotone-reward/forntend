import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";

const Signup = () => {
  const navigate = useNavigate(); // Add navigate hook

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility

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
      await axios.post(
  `${import.meta.env.VITE_API_URL}/auth/signup`,
  form
);

      setMessage("Signup successful. Redirecting to login...");
      setForm({
        name: "",
        email: "",
        phone: "",
        country: "",
        password: "",
      });

      setTimeout(() => navigate("/login"), 2000); // Redirect to login after 2 seconds
    } catch (err) {
      setMessage(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="p-10 rounded-lg space-x-10">
        <h3 className="text-3xl text-black font-bold mb-2 text-center">
          Join Our Research Panel
        </h3>
        <p
          className="font-normal mb-5  text-center"
          style={{ fontSize: "16px" }}
        >
          A global market research company providing end to end research solutions
        </p>

        <div className="flex items-center">
          <div className="flex flex-col items-center mr-10 text-left">
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
          <form
            onSubmit={handleSubmit}
            className="w-90 p-6 bg-white flex flex-col gap-3 border border-gray-200 rounded-lg"
          >
            {message && (
              <p
                className={`p-2 text-center rounded ${message.includes(
                  "successful"
                ) ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
              >
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
              className="w-full p-2 border rounded"
            />

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded"
            />

            <input
              type="text"
              name="phone"
              placeholder="Phone Number"
              value={form.phone}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded"
            />

            <input
              type="text"
              name="country"
              placeholder="Country"
              value={form.country}
              onChange={handleChange}
              required
              className="w-full p-2 border rounded"
            />

            <div className="relative w-full mb-4">
              <input
                type={showPassword ? "text" : "password"} // Toggle input type
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={handleChange}
                required
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
              type="submit"
              disabled={
                loading ||
                !form.name ||
                !form.email ||
                !form.phone ||
                !form.country ||
                !form.password
              }
              className={`w-full py-2 rounded ${
                loading ||
                !form.name ||
                !form.email ||
                !form.phone ||
                !form.country ||
                !form.password
                  ? "bg-gray-300 text-gray-500 font-semibold cursor-not-allowed"
                  : "bg-blue-800 text-white font-semibold"
              }`}
            >
              {loading ? "Creating..." : "Create Account"}
            </button>
            <p style={{ marginTop: "12px", textAlign: "center" }}>
              Already have an account?{" "}
              <Link to="/login" style={{ color: "#2563eb" }}>
                Login
              </Link>
            </p>
          </form>
        </div>
        <footer className="text-center py-2 mt-4 text-gray-400 border-t border-b-gray-50">
          © 2026 Kphotone Research. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default Signup;
