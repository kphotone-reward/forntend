import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { checkPasswordRules } from "../utils/passwordValidator";

function ChangePassword() {
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRules, setShowRules] = useState(false);
 const [passwordRules, setPasswordRules] = useState({
  length: false,
  uppercase: false,
  lowercase: false,
  number: false,
  special: false,
});

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      setError("Please fill all fields.");
      return;
    }

    const rules = checkPasswordRules(newPassword);
    const isValid = Object.values(rules).every(Boolean);

    if (!isValid) {
      setError("Password does not meet requirements");
      return;
    }

    if (loading) return;

    try {
      setLoading(true);
      setError("");

      await api.post(
        "/auth/change-password",
        { currentPassword, newPassword },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      localStorage.removeItem("token");
      navigate("/login");

    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex">

      <div className="w-3/5 banner-bg h-screen hidden sm:flex relative">
        <div className="absolute bottom-1 left-5">
          <img src="https://raw.githubusercontent.com/kphotone-research/Images-kphotone/main/Logo.png" width={250} />
        </div>
      </div>

      <div className="w-full sm:w-2/5 h-screen px-8 flex flex-col justify-center max-w-md">

        <h3 className="text-2xl font-bold">Change Password</h3>

        {error && (
          <p className="bg-red-100 text-red-700 p-2 rounded mt-2">{error}</p>
        )}
 <div className="relative w-full mt-2"></div>
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Current Password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="mt-4 p-3 border rounded"
        />
        <span
            onClick={() => setShowPassword(!showPassword)}
             className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-xl text-gray-500"
          >
            {showPassword ? "👁️" : "🕶️"}
          </span>
        </div>
 <div className="relative w-full mt-2">
        <input
          type={showPassword ? "text" : "password"}
          placeholder="New Password"
          value={newPassword}
          onFocus={() => setShowRules(true)}
          onBlur={() => {
            if (!newPassword) setShowRules(false);
          }}
          onChange={(e) => {
            const value = e.target.value;
            setNewPassword(value);
            setPasswordRules(checkPasswordRules(value));
          }}
          className="w-full p-3 text-2md  text-black font-semibold border rounded focus:ring-2 focus:ring-blue-500 outline-none"
        />
         <span
            onClick={() => setShowPassword(!showPassword)}
             className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-xl text-gray-500"
          >
            {showPassword ? "👁️" : "🕶️"}
          </span>
          </div>
        

        {showRules && (
          <div className="text-sm mt-2 space-y-1 flex flex-row flex-wrap gap-2 italic">
  <p className={passwordRules.length ? "text-green-600" : "text-red-500"}>
    {passwordRules.length ? "✔" : "✖"} At least 8 characters
  </p>

  <p className={passwordRules.uppercase ? "text-green-600" : "text-red-500"}>
    {passwordRules.uppercase ? "✔" : "✖"} One uppercase letter
  </p>

  <p className={passwordRules.lowercase ? "text-green-600" : "text-red-500"}>
    {passwordRules.lowercase ? "✔" : "✖"} One lowercase letter
  </p>

  <p className={passwordRules.number ? "text-green-600" : "text-red-500"}>
    {passwordRules.number ? "✔" : "✖"} One number
  </p>

  <p className={passwordRules.special ? "text-green-600" : "text-red-500"}>
    {passwordRules.special ? "✔" : "✖"} One special character
  </p>
</div>
        )}

        <button
          onClick={handleChangePassword}
          disabled={loading}
          className={`mt-4 py-3 rounded text-white ${
            loading ? "bg-gray-400" : "bg-blue-800"
          }`}
        >
          {loading ? "Updating..." : "Update Password"}
        </button>

      </div>
    
  );
}

export default ChangePassword;