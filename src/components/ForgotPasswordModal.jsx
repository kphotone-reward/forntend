import { useState } from "react";
import api from "../api/axios";


const ForgotPasswordModal = ({ onClose }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!email) {
      setError("Please enter your email address");
      setLoading(false);
      return;
    }

    try {
      const res = await api.post("/auth/forgot-password", { email });
      
      if (res.status === 200 || res.status === 201) {
        setSuccess("Password reset link has been sent to your email");
        setTimeout(() => {
          onClose();
        }, 2000);
        return;
      }
      
      setError("Failed to send reset link");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3 className="font-bold py-4 text-2xl ">Reset Password</h3>

        <form onSubmit={handleSubmit}>
          <div className="text-gray-600 mb-4 text-md">
           <p>Send your password reset request to our support team. They will assist you in resetting your password</p> 
           <p className="mt-4"> Please include your registered email address in the request. 
            <a className="text-blue-600 " href="mailto:support@kphotone.com?subject=Password%20Reset%20Request&body=Hello%0D%0A%0D%0AI%20need%20to%20reset%20my%20password.%20My%20email%20is:%20">support@kphotone.com.</a>
.       </p>
          </div>

          {/* <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full mb-4 p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          /> */}

          {/* {error && (
            <p style={{ color: "red" }} className="mb-4 text-sm">
              {error}
            </p>
          )} */}

          {/* {success && (
            <p style={{ color: "green" }} className="mb-4 text-sm">
              {success}
            </p>
          )} */}

          <div style={styles.actions}>
            <button
              className="bg-transparent hover:bg-blue-500 text-blue-700 font-semibold hover:text-white py-2 px-4 border border-blue-500 hover:border-transparent rounded"
              type="button"
              onClick={onClose}
            >
              Cancel
            </button>
            {/* <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              type="submit"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button> */}
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

export default ForgotPasswordModal;
