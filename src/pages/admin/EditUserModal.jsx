import { useState } from "react";
import axios from "axios";

const EditUserModal = ({ user, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    name: user.name || "",
    phone: user.phone || "",
    country: user.country || "",
    isActive: user.isActive ?? true,
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false); // State to toggle password visibility

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "phone" && value.length > 10) {
      return; // Prevent input longer than 10 digits
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");

      const payload = {
        name: form.name,
        phone: form.phone,
        country: form.country,
        isActive: form.isActive,
      };

      // only include password if admin entered it
      if (form.password && form.password.trim()) {
        payload.password = form.password;
      }

      await axios.put(
         `${import.meta.env.VITE_API_URL}/auth/users/${user._id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (typeof onSuccess === "function") {
        await onSuccess(); // refresh users list
      }

      onClose();
    } catch (err) {
      console.error("Update user error:", err.response?.data || err);
      setError(
        err.response?.data?.message ||
        "Failed to update user"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3 style={{ fontSize: "22px", marginBottom: "16px" }}>
          Edit User
        </h3>

        <form onSubmit={handleSubmit}>
          {/* Email (read-only) */}
          <input
            value={user.email}
            disabled
            style={styles.inputDisabled}
          />

          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Name"
            required
            style={styles.input}
          />

          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Phone"
            required
            style={styles.input}
          />

          <input
            name="country"
            value={form.country}
            onChange={handleChange}
            placeholder="Country"
            required
            style={styles.input}
          />

          <label style={styles.checkbox}>
            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleChange}
            />
            Active
          </label>
          <p style={styles.helperText} className="text-sm italic text-gray-300">
            If unchecked, the user will be marked as inactive and will not be able to log in.
          </p>

          <div className="relative w-full mb-4">
            <input
              name="password"
              type={showPassword ? "text" : "password"} // Toggle input type
              placeholder="New Password (optional)"
              onChange={handleChange}
              value={form.password}
              style={styles.input}
            />
            <span
              onClick={() => setShowPassword(!showPassword)} // Toggle visibility
              className="absolute right-3 top-3 cursor-pointer text-gray-500"
            >
              {showPassword ? "\u{1F441}" : "\u{1F576}"} {/* Eye icon */}
            </span>
            <p style={styles.helperText} className="text-sm italic text-gray-300">
            Leave password empty to keep current password
          </p>
          </div>

          

          {error && <p style={styles.error}>{error}</p>}

          <div style={styles.actions}>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
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
    width: "420px",
    borderRadius: "8px",
  },
  input: {
    width: "100%",
    marginBottom: "12px",
    padding: "8px",
    border: "1px solid #ccc",
    borderRadius: "4px",
  },
  inputDisabled: {
    width: "100%",
    marginBottom: "12px",
    padding: "8px",
    background: "#f3f4f6",
    border: "1px solid #ccc",
    borderRadius: "4px",
  },
  checkbox: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    marginBottom: "12px",
  },
  helperText: {
    fontSize: "12px",
    color: "#555",
    marginBottom: "8px",
  },
  error: {
    color: "red",
    marginBottom: "8px",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    marginTop: "12px",
  },
};

export default EditUserModal;
