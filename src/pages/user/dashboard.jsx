import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

function UserDashboard() {
  const [activeTab, setActiveTab] = useState("completedSurveys");

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

  useEffect(() => {
  if (activeTab === "assign") {
    setUser(null);
    setSelectedSpecialities([]);
  }
}, [activeTab]);


  // Fetch assigned surveys
  useEffect(() => {
    const fetchAssignedSurveys = async () => {
      try {
        const res = await api.get("/surveys/assigned", {
          params: { userId: user?._id },
        });
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

  // Debugging: Log surveys data to verify assignmentStatus
  useEffect(() => {
    //console.log("Survey Data:", surveys);
  }, [surveys]);

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

  //fetach Completed Survey
  const [completedSurveys, setCompletedSurveys] = useState([]);
  useEffect(() => {
  const fetchCompletedSurveys = async () => {
    try {
      const res = await api.get("/surveys/completed");
      setCompletedSurveys(res.data.surveys || []);
    } catch (err) {
      console.error("Failed to fetch completed surveys", err);
    }
  };

  fetchCompletedSurveys();
}, []);

  // State for redemption requests
  const [redemptionRequests, setRedemptionRequests] = useState([]);

  // Fetch redemption requests
  useEffect(() => {
    const fetchRedemptionRequests = async () => {
      try {
        const res = await api.get("/redemption/requests"); // Corrected endpoint
        setRedemptionRequests(res.data.requests || []);
        // Log the API response inside the try block
        //console.log("Redemption Requests API Response:", res.data);
      } catch (err) {
        console.error("Failed to fetch redemption requests", err);
      }
    };

    fetchRedemptionRequests();
    //console.log("Redemption Requests API Response:", res.data); // Moved inside the try block
  }, []);

  // Add real-time updates for quick actions
  useEffect(() => {
    const interval = setInterval(() => {
      fetchProfile(); // Refresh user profile data
      const fetchRedemptionRequests = async () => {
        try {
          const res = await api.get("/redemption/requests");
          setRedemptionRequests(res.data.requests || []);
        } catch (err) {
          console.error("Failed to fetch redemption requests", err);
        }
      };
      fetchRedemptionRequests();
    }, 3000); // Refresh every 3 seconds

    return () => clearInterval(interval);
  }, []);

  // Separate pending and approved requests
  const pendingRequests = redemptionRequests.filter(
    (request) => request.status === "pending"
  );
  const approvedRequests = redemptionRequests.filter(
    (request) => request.status === "approved"
  );

  // Filter surveys to show only those with rewarded status
  const filteredSurveys = surveys.filter(
    (survey) => survey.assignmentStatus === "rewarded"
  );

  // Calculate total earned points
  const totalEarnedPoints = filteredSurveys.reduce(
    (sum, survey) => sum + (survey.rewardPoints || 0),
    0
  );

  // Log survey names and statuses
  useEffect(() => {
    if (filteredSurveys.length > 0) {
      // console.log("Assigned Surveys:");
      filteredSurveys.forEach((survey) => {
        //console.log(`Survey Name: ${survey.title}, Status: ${survey.status}`);
      });
    }
  }, [filteredSurveys]);

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
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header at the top */}
      <header className="bg-white px-4 md:px-6 py-2 border-b border-gray-300 fixed top-0 left-0 w-full z-10">
        <div className="flex justify-between items-center px-4">
          <img
            src="https://raw.githubusercontent.com/kphotone-research/Images-kphotone/main/Logo.png"
            alt="Logo"
            className="w-24 md:w-36 h-auto" // Responsive logo size
          />
          <div className="lex items-center relative">
             <span className="text-xs md:text-sm text-gray-950 mr-2 md:mr-4 capitalize truncate max-w-[100px] md:max-w-none">
              {user?.name}
            </span>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-600 px-2 py-1 rounded text-[10px] md:text-[12px]"
            >
              ▼
            </button>
            {showDropdown && (
              <div
                ref={dropdownRef}
                className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded shadow-lg z-50"
            style={{ top: "100%" }}
              >
                <div className="px-4 py-2 text-xs md:text-sm text-gray-700 border-b">{user?.email}</div>
                 <div className="px-4 py-2 text-xs md:text-sm text-gray-700 border-b">{user?.speciality}</div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content with left-side menu */}
      <div className="flex flex-col md:flex-row flex-1 mt-16">
              {/* Sidebar: Moves to top on mobile for quick access */}
      <aside className="w-full md:w-64 bg-gray-100 p-4 border-b md:border-b-0 md:border-r border-gray-300 order-2 md:order-none">
      <h3 className="text-sm font-bold text-gray-700 mb-4 text-center md:text-left">Quick Actions</h3>
      <ul className="grid grid-cols-2 md:grid-cols-1 gap-3">
        <li>
          <a href="#dashboard" className="block bg-blue-500 text-white text-center py-2 px-4 rounded-lg text-sm shadow hover:bg-blue-600">
            Dashboard
          </a>
        </li>
        <li>
          <a href="/user/redeemPoints" className="block bg-green-500 text-white text-center py-2 px-4 rounded-lg text-sm shadow hover:bg-green-600">
            Redeem Points
          </a>
        </li>
      </ul>
      </aside>

        {/* Left-side menu */}
        <main className="flex-1 p-4 md:p-6 order-1 md:order-none">
          {/* Notification */}
          {notification && (
            <div
              className={`mb-4 p-4 rounded border text-sm ${
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
      <div className="mb-6">
        <h1 className="text-xl font-bold">Welcome!</h1>
        <p className="text-gray-500 text-sm">Your rewards and surveys are ready.</p>
      </div>

            {/* Stats Section: Stacks vertically on small screens */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        {/* Reward Card */}
        <div className="bg-blue-600 p-6 shadow-md text-center flex flex-col justify-center w-full lg:w-1/3 rounded-xl text-white">
          <p className="text-blue-100 text-xs uppercase tracking-wider mb-1">Current Reward Points</p>
          <p className="font-bold text-4xl">
            {user?.points ?? 0}
          </p>
        </div>

        {/* Redeem Card */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm w-full lg:flex-1">
          <h3 className="mb-3 font-semibold text-sm text-gray-700">Redeem Points</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Enter points (min 50)"
              value={redeemPoints}
              onChange={(e) => setRedeemPoints(e.target.value)}
              className="p-2.5 bg-gray-50 rounded border border-gray-300 w-full outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleRedeem}
              disabled={(user?.points ?? 0) < 50}
              className={`whitespace-nowrap px-6 py-2 rounded text-sm font-bold text-white transition-colors ${
                (user?.points ?? 0) < 50 ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              Redeem Now
            </button>
          </div>
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-500">Available: <b>{user?.points ?? 0}</b></p>
            {(user?.points ?? 0) < 50 && (
              <p className="text-red-500 italic text-[10px]">Min 50 points required</p>
            )}
          </div>
        </div>
      </div>



        




          {/* Tabs for Completed Surveys and Redemption Logs */}
          <div className="mb-4 ">
            <div className="flex border-b border-gray-300 overflow-x-auto">
             <button
            className={`whitespace-nowrap px-6 py-3 text-sm font-bold transition-all ${
              activeTab === "completedSurveys" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-400"
            }`}
            onClick={() => setActiveTab("completedSurveys")}
          >
            Completed Surveys
          </button>
          <button
            className={`whitespace-nowrap px-6 py-3 text-sm font-bold transition-all ${
              activeTab === "redemptionLogs" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-400"
            }`}
            onClick={() => setActiveTab("redemptionLogs")}
          >
            Redemption Logs
          </button>
            </div>
          <div className="mt-6">
          {/* Scrollable Table Container */}
          <div className="overflow-x-auto  bg-white"></div>

            {activeTab === "completedSurveys" && (
              <div>
                {/* <h3 className="text-md font-bold">Completed Surveys</h3> */}
                <h2 className="text-sm italic mb-4">
                  Total Earned Points (Till Date): {totalEarnedPoints}
                </h2>
                <div className="overflow-y-auto max-h-96">
                  {/* Completed Surveys Table */}
                  
                  <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-700 uppercase text-[10px] font-bold border-b">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Survey</th>
                    <th className="py-3 px-4">Points</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                   <tbody className="divide-y divide-gray-100">
                      {filteredSurveys.slice(0, 3).map((survey) => {
  console.log(survey); // Log each survey object
  return (
    <tr key={survey._id} className="hover:bg-gray-50">
      <td className="py-3 px-4 font-medium">
       {new Date(survey.endDate).toLocaleDateString()}
      </td>
      <td className="py-3 px-4 font-medium">{survey.title}</td>
      <td className="py-3 px-4 font-medium">{survey.rewardPoints}</td>
      <td className="py-3 px-4 text-gray-600 capitalize">
        <span
          className={`px-3 py-1 rounded text-sm font-medium ${
            survey.status === "active"
              ? "bg-green-50 border-green-500 text-green-600 border rounded-1xl"
              : "bg-blue-50 border-blue-500 text-blue-600 border rounded-1xl"
          }`}
        >
          {survey.status === "active" ? "Rewarded" : survey.status}
        </span>
      </td>
    </tr>
  );
})}

                      
                      
                    </tbody>
                  </table>

                  {filteredSurveys.length === 0 && (
                    <p className="text-gray-500 mt-4">No surveys assigned</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "redemptionLogs" && (
              <section className="mt-4">
                {/* <h2 className="text-md font-bold">Redemption Requests Logs</h2> */}
                <div className="overflow-y-auto max-h-96">
                  {/* <hr className="my-2 border-gray-300" /> */}

                  <h3 className="text-sm font-semibold ">
                    Pending Requests 
                  </h3>
                  <p className="text-sm italic mb-4">Total Pending Points: {pendingRequests.reduce((sum, request) => sum + request.points, 0)}&nbsp; (when admin approved its will be deducted from your points)</p>
                  {pendingRequests.length > 0 ? (
                    <table className="w-full text-sm border border-gray-300 border-b-0 rounded-lg shadow-sm">
                      <thead className="bg-gray-100 border-b border-gray-300">
                        <tr>
                          <th className="py-2 px-4 text-left border-r border-gray-300 font-semibold text-gray-700">Product ID</th>
                          <th className="py-2 px-4 text-left border-r border-gray-300 font-semibold text-gray-700">Date</th>
                          <th className="py-2 px-4 text-left border-r border-gray-300 font-semibold text-gray-700">Points</th>
                          <th className="py-2 px-4 text-left font-semibold text-gray-700">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {pendingRequests.map((request) => (
                          <tr key={request._id} className="border-b">
                            <td className="py-2 px-4 border-r border-gray-300 text-gray-800">{request._id}</td>
                            <td className="py-2 px-4 border-r border-gray-300 text-gray-800">{new Date(request.createdAt).toLocaleDateString()}</td>
                            <td className="py-2 px-4 border-r border-gray-300 text-gray-800">{request.points}</td>
                            <td className="py-2 px-4 text-gray-800 capitalize">{request.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-gray-500 italic text-sm">No pending requests.</p>
                  )}

                  <hr className="my-4 border-gray-300" />

                  <h3 className="text-sm font-semibold">Approved Requests</h3>
                   <p className="mb-4 text-sm italic">Total Approved Points Till Date: {approvedRequests.reduce((sum, request) => sum + request.points, 0)}</p>
                  {approvedRequests.length > 0 ? (
                    <>
                      <table className="w-full text-sm border border-gray-300 border-b-0 rounded-lg shadow-sm">
                        <thead className="bg-gray-100 border-b border-gray-300">
                          <tr>
                            <th className="py-2 px-4 text-left border-r border-gray-300 text-gray-800 font-semibold">Product ID</th>
                            <th className="py-2 px-4 text-left border-r border-gray-300 text-gray-800 font-semibold">Date</th>
                            <th className="py-2 px-4 text-left border-r border-gray-300 font-semibold text-gray-700">Points</th>
                            <th className="py-2 px-4 text-left font-semibold text-gray-700">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {approvedRequests.map((request) => (
                            <tr key={request._id} className="border-b">
                              <td className="py-2 px-4 border-r border-gray-300 text-gray-800">{request._id}</td>
                              <td className="py-2 px-4 border-r border-gray-300 text-gray-800">
                                {new Date(request.createdAt).toLocaleDateString()}
                              </td> 
                              <td className="py-2 px-4 border-r border-gray-300 text-gray-800">{request.points}</td>
                              <td className="py-2 px-4 text-gray-800 capitalize">{request.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                    </>
                  ) : (
                    <p className="text-sm">No approved requests.</p>
                  )}
                </div>
              </section>
            )}
            
            </div>
          </div>
        </main>

        {/* Right-side content */}
        

        {/* <aside className="bg-gray-100 p-4 border-r border-gray-300 rounded-lg shadow-md" style={{ width: "250px" }}>
          <h3 className="text-md font-bold text-gray-700 mb-4 text-center">Quick Actions</h3>
          <ul className="space-y-4">
            <li>
              <a
                href="#dashboard"
                className="block bg-blue-500 text-white text-center py-2 px-4 rounded-lg shadow hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
              >
                 Dashboard
              </a>
            </li>
            <li>
              <a
                href="/user/redeemPoints"
                className="block bg-green-500 text-white text-center py-2 px-4 rounded-lg shadow hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300"
              >
                Redeem Points
              </a>
            </li>
          </ul>
        </aside> */}
      </div>
    </div>
  );
}

export default UserDashboard;
