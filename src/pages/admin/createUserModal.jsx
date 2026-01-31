import { useState } from "react";
import axios from "axios";

const CreateUserModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone" && value.length > 10) {
      return; // Prevent input longer than 10 digits
    }

    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/signup`, // OR admin API if you have it
        form,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // ✅ SUCCESS
      if (res.status === 200 || res.status === 201) {
        if (typeof onSuccess === "function") {
          await onSuccess(); // refresh users list
        }
        onClose(); // close modal
        return;
      }

      setError("Unexpected response from server");
    } catch (err) {
      console.error("Create user error:", err);
      setError(
        err.response?.data?.message ||
        "Failed to create user"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3 className="font-bold py-4 text-2xl">Create User</h3>

        <form onSubmit={handleSubmit}>
          <input
            name="name"
            placeholder="Name"
            className="w-full mb-4 p-2 border rounded"
            onChange={handleChange}
            required
          />
          <input
            name="email"
            type="email"
            placeholder="Email"
            className="w-full mb-4 p-2 border rounded"
            onChange={handleChange}
            required
          />
          <input
            name="phone"
            placeholder="Phone"
            className="w-full mb-4 p-2 border rounded"
            onChange={handleChange}
            value={form.phone}
            required
          />
          <input
            name="country"
            placeholder="Country"
            className="w-full mb-4 p-2 border rounded"
            onChange={handleChange}
            required
          />
          <div className="relative w-full mb-4">
            <input
              name="password"
              type={showPassword ? "text" : "password"} // Toggle input type
              placeholder="Temp Password"
              className="w-full p-2 border rounded"
              onChange={handleChange}
              value={form.password}
              required
            />
            <span
              onClick={() => setShowPassword(!showPassword)} // Toggle visibility
              className="absolute right-3 top-3 cursor-pointer text-gray-500"
            >
              {showPassword ? "\u{1F441}" : "\u{1F576}"} {/* Eye icon */}
            </span>
          </div>
          {error && <p style={{ color: "red" }}>{error}</p>}

          <div style={styles.actions}>
            <button
              className="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              type="submit"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    background: "#fff",
    padding: "20px",
    width: "360px",
    borderRadius: "8px",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "12px",
  },
};

export default CreateUserModal;
