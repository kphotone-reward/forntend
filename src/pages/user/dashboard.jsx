import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

function UserDashboard() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [surveys, setSurveys] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [redeemPoints, setRedeemPoints] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [notification, setNotification] = useState(null); // State for notification
  const [notificationType, setNotificationType] = useState("info"); // State for notification type

  const dropdownRef = useRef(null);

  // ✅ fetchProfile MUST be outside useEffect
  const fetchProfile = async () => {
    try {
      const res = await api.get("/auth/profile");
      setUser(res.data.user);
    } catch (err) {
      console.error("Profile fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  // Load profile on mount
  useEffect(() => {
    const interval = setInterval(() => {
      fetchProfile(); // auto refresh
    }, 5000); // every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Fetch assigned surveys
  useEffect(() => {
    const fetchAssignedSurveys = async () => {
      try {
        const res = await api.get("/survey/assigned");
        setSurveys(res.data.surveys || []);
      } catch (err) {
        console.error("Failed to fetch surveys", err);
        setErrorMessage("Failed to fetch assigned surveys");
      }
    };

    if (user) {
      fetchAssignedSurveys();
    }
  }, [user]);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // ✅ Redeem handler (FIXED)
  const handleRedeem = async () => {
    if (!user) {
      setNotification("User not found. Please log in again."); // Notify user
      setNotificationType("error"); // Set notification type to error
      return;
    }

    if ((user?.points ?? 0) < 50) {
      setNotification("You need at least 50 points"); // Set notification
      setNotificationType("warning"); // Set notification type to warning
      return;
    }

    if (Number(redeemPoints) < 50) {
      setNotification("Minimum redeem amount is 50"); // Set notification
      setNotificationType("warning"); // Set notification type to warning
      return;
    }

    try {
      const res = await api.post("/redemption/request", {
        points: Number(redeemPoints),
      });

      setNotification(res.data.message); // Set success notification
      setNotificationType("success"); // Set notification type to success
      setRedeemPoints("");
      fetchProfile(); // refresh points
    } catch (err) {
      console.error("Redeem request failed", err); // Log error for debugging
      setNotification(err.response?.data?.message || "Redeem failed"); // Set error notification
      setNotificationType("error"); // Set notification type to error
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Clear notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header at the top */}
      <header className="bg-white px-6  py-2 border-b border-gray-300 fixed top-0 left-0 w-full z-10">
        <div className="flex justify-between items-center">
          <img
            src="https://raw.githubusercontent.com/kphotone-research/Images-kphotone/main/Logo.png"
            alt="Logo"
            style={{ width: 150, height: 50 }}
          />
          <div className="flex items-center relative">
            <span className="text-sm/6 text-gray-950 dark:text-white mr-4 capitalize">
              {user?.email?.split("@")[0]}
            </span>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-400 px-1 py-1 rounded text-[12px]"
            >
              ▼
            </button>
            {showDropdown && (
              <div
                ref={dropdownRef}
                className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded shadow-md"
                style={{ top: "100%" }}
              >
                <div className="px-4 py-2 text-gray-700">{user?.email}</div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-100"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content with left-side menu */}
      <div className="flex flex-1 mt-16">
        {/* Left-side menu */}
        <aside className=" bg-gray-100 p-4 border-r border-gray-300" style={{ width: "250px" }}>
          <ul className="space-y-4">
            <li>
              <a href="#dashboard" className="text-blue-600 hover:underline">
                Dashboard
              </a>
            </li>
            <li>
              <a href="/user/survey" className="text-blue-600 hover:underline">
                Survey
              </a>
            </li>
            <li>
              <a href="/user/redeemPoints" className="text-blue-600 hover:underline">
                Redeem Status
              </a>
            </li>
          </ul>
        </aside>

        {/* Right-side content */}
        <main className="flex-1 p-6">
          {/* Notification */}
          {notification && (
            <div
              className={`mb-4 p-4 rounded border ${
                notificationType === "success"
                  ? "bg-green-100 text-green-800 border-green-300"
                  : notificationType === "warning"
                  ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                  : "bg-red-100 text-red-800 border-red-300"
              }`}
            >
              {notification}
            </div>
          )}

          {/* Welcome Message */}
          <div className=" mb-6">
            <h1 className="text-3xl font-bold">Welcome!</h1>
            <p className="text-gray-500">Your rewards and recent surveys are ready to review.</p>
          </div>

          {/* Stats */}
          <div className="flex justify-start gap-4 mb-6">
            <div
              className="bg-blue-500 p-4  shadow text-center flex justify-center flex-col"
              style={{ width: "250px", borderRadius: "12px" }}
            >
              <p className="text-white" style={{ fontSize: "18px" }}>
                Total Reward Points
              </p>
              <p
                className="text-white font-bold"
                style={{
                  fontSize: `${Math.max(
                    4 - String(user?.points ?? 0).length * 0.5,
                    2
                  )}rem`,
                }}
              >
                {user?.points ?? 0}
              </p>
            </div>

            {/* Redeem Box */}
            <div
              className="bg-blue-50 p-4 rounded  border border-blue-300"
              style={{ width: "400px", borderRadius: "12px" }}
            >
              <h3 className="mb-2 font-semibold" style={{ fontSize: "18px" }}>
                Redeem Points
              </h3>

              <input
                type="text"
                placeholder="Enter points (min 50)"
                value={redeemPoints}
                onChange={(e) => setRedeemPoints(e.target.value)}
                className="p-2 bg-white rounded border  w-full"
                style={{ appearance: "textfield" }}
                onWheel={(e) => e.target.blur()} // Prevent scroll increment/decrement
              />

              <p className="mt-2 text-sm text-gray-600">
                Available Points: <b>{user?.points ?? 0}</b>
              </p>
 <div className="flex justify-between flex-row-reverse items-center">
              <button
                onClick={handleRedeem}
                disabled={(user?.points ?? 0) < 50}
                className={`float-end mt-3 p-2 px-4 rounded text-white ${
                  (user?.points ?? 0) < 50 ? "bg-gray-400" : "bg-blue-500"
                }`}
              >
                Redeem Points
              </button>

              {(user?.points ?? 0) < 50 && (
                <p className="text-red-500 italic mt-2" style={{fontSize:"12px"}}>
                  Minimum 50 points required to redeem
                </p>
               
              )}
               </div>
            </div>
          </div>

          {/* Recent Surveys */}
          <div className="mt-12">
            <h3 className="text-xl font-bold">Recent Survey</h3>
            <p className="text-sm text-gray-500 mb-4">
              Recent surveys assigned to your account
            </p>
            <hr className="mb-2 border-gray-300" />
            <div className="flex flex-wrap gap-4">
              {surveys.slice(0, 3).map((survey) => (
                <div
                  key={survey._id}
                  className="bg-white p-4 rounded shadow w-64"
                >
                  <h4 className="font-semibold">{survey.title}</h4>
                  <a
                    href={survey.surveyLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 text-sm underline"
                  >
                    Open Survey
                  </a>

                  <div className="flex justify-between items-center mt-3">
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded">
                      {survey.rewardPoints} pts
                    </span>
                    <span className="text-xs capitalize px-2 py-1 rounded bg-blue-500 text-white">
                      {survey.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {surveys.length === 0 && (
              <p className="text-gray-500 mt-4">No surveys assigned</p>
            )}
          </div>

          {errorMessage && <p className="text-red-500 mt-4">{errorMessage}</p>}
        </main>
      </div>
    </div>
  );
}

export default UserDashboard;
