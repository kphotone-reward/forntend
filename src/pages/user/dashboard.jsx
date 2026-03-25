import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

function UserDashboard() {
  const [activeTab, setActiveTab] = useState("assignedSurveys");

  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [surveys, setSurveys] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedRedeemSurveyId, setSelectedRedeemSurveyId] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [notification, setNotification] = useState(null); // State for notification
  const [notificationType, setNotificationType] = useState("info"); // State for notification type
  const [redemptionRequests, setRedemptionRequests] = useState([]); // ✅ add this

  const dropdownRef = useRef(null);

  // ✅ fetchProfile MUST be outside useEffect
  const fetchProfile = async () => {
    try {
      const res = await api.get("/auth/profile");
      setUser(res.data.user);
    } catch (err) {
      // console.error("Profile fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ reusable fetch for assigned surveys
  const fetchAssignedSurveys = async (userId) => {
    if (!userId) return;
    try {
      const res = await api.get("/surveys/assigned", {
        params: { userId },
      });
      setSurveys(res.data.surveys || []);
    } catch (err) {
      setErrorMessage("Failed to fetch assigned surveys");
    }
  };

  // ✅ reusable fetch for redemption requests
  const fetchRedemptionRequests = async () => {
    try {
      const res = await api.get("/redemption/requests");
      setRedemptionRequests(res.data.requests || []);
    } catch (err) {
      // console.error("Failed to fetch redemption requests", err);
    }
  };

  // Load profile on mount
  useEffect(() => {
    const interval = setInterval(() => {
      if (user?._id) {
        fetchAssignedSurveys(user._id);
      }
      fetchProfile();
      fetchRedemptionRequests();
    }, 5000);

    return () => clearInterval(interval);
  }, [user?._id]);

  useEffect(() => {
    if (activeTab === "assign") {
      setUser(null);
      // setSelectedSpecialities([]); // removed: not defined in this component
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Fetch assigned surveys
  useEffect(() => {
    if (user?._id) {
      fetchAssignedSurveys(user._id);
    }
  }, [user?._id]);

  // Fetch redemption requests
  useEffect(() => {
    fetchRedemptionRequests();
  }, []);

  // Add real-time updates for quick actions
  useEffect(() => {
    const interval = setInterval(() => {
      fetchProfile();
      fetchRedemptionRequests();
    }, 3000); // Refresh every 3 seconds

    return () => clearInterval(interval);
  }, []);

  // Normalize any id to string
  const toId = (v) => {
    const id = typeof v === "string" ? v : v?._id;
    return id ? String(id) : "";
  };

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

  surveys.forEach(s => {
    // console.log("assignmentStatus:", s.assignmentStatus);
    // console.log("status:", s.status);
  });


  // ✅ exclude surveys already in pending/approved redemption requests
  const redeemedSurveyIds = new Set(
    redemptionRequests
      .filter((request) => request.status === "pending" || request.status === "approved")
      .flatMap((request) => {
        if (request.assignedSurvey) return [toId(request.assignedSurvey)];
        if (Array.isArray(request.assignedSurveys)) return request.assignedSurveys.map(toId);
        return [];
      })
      .filter(Boolean)
  );

  const eligibleSurveys = filteredSurveys.filter(
    (survey) => !redeemedSurveyIds.has(toId(survey))
  );

  useEffect(() => {
    if (filteredSurveys.length === 0) {
      setSelectedRedeemSurveyId("");
    }
  }, [filteredSurveys]);

  // Clear selection if selected survey is no longer eligible
  useEffect(() => {
    if (
      selectedRedeemSurveyId &&
      selectedRedeemSurveyId !== "__ALL__" &&
      !eligibleSurveys.some((s) => toId(s) === String(selectedRedeemSurveyId))
    ) {
      setSelectedRedeemSurveyId("");
    }
  }, [eligibleSurveys, selectedRedeemSurveyId]);

  // Calculate total earned points
  const totalEarnedPoints = filteredSurveys.reduce(
    (sum, survey) => sum + (survey.rewardPoints || 0),
    0
  );

  const eligibleTotalPoints = eligibleSurveys.reduce(
    (sum, survey) => sum + (survey.rewardPoints || 0),
    0
  );

  const pendingPoints = pendingRequests.reduce(
  (sum, request) => sum + request.points,
  0
);
const availablePoints = (user?.points ?? 0) - pendingPoints;

  // Log survey names and statuses
  useEffect(() => {
    if (filteredSurveys.length > 0) {
      //console.log("Assigned Surveys:");
      filteredSurveys.forEach((survey) => {
        // console.log(`Survey Name: ${survey.title}, Status: ${survey.status}`);
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleRedeem = async () => {
    if (!user) {
      setNotification("User not found. Please log in again.");
      setNotificationType("error");
      return;
    }

    if (selectedRedeemSurveyId === "__ALL__") {
      if (eligibleSurveys.length === 0) {
        setNotification("No eligible surveys available");
        setNotificationType("warning");
        return;
      }

      try {
        const surveyIds = eligibleSurveys.map((s) => s._id);

        const res = await api.post("/redemption/request", {
          assignedSurveys: surveyIds,
        });

        setNotification(res.data.message || "Redeem request submitted");
        setNotificationType("success");
        setSelectedRedeemSurveyId("");

        await fetchRedemptionRequests();
        await fetchAssignedSurveys(user._id);
        await fetchProfile();
        const updated = await api.get("/redemption/requests");
        setRedemptionRequests(updated.data.requests || []);

      } catch (err) {
        setNotification(err?.response?.data?.message || "Redeem failed");
        setNotificationType("error");
      }
      return;
    }

    if (!selectedRedeemSurveyId) {
      setNotification("Please select a survey");
      setNotificationType("warning");
      return;
    }

    try {
      const res = await api.post("/redemption/request", {
        assignedSurvey: selectedRedeemSurveyId,
      });

      // immediate remove from dropdown/points (pending)
      setRedemptionRequests((prev) => [
        ...prev,
        { status: "pending", assignedSurvey: { _id: selectedRedeemSurveyId } },
      ]);

      setNotification(res.data.message || "Redeem request submitted");
      setNotificationType("success");
      setSelectedRedeemSurveyId("");

      await fetchRedemptionRequests(); // keep sync with backend
      await fetchAssignedSurveys(user._id);
      await fetchProfile();
    } catch (err) {
      setNotification(err?.response?.data?.message || "Redeem failed");
      setNotificationType("error");
    }
  };


  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header at the top */}
      <header className="bg-white border-b border-gray-200 fixed top-0 left-0 w-full z-50">
        {/* The Container: Centered with a max-width and horizontal padding */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">

          {/* Left Side: Logo */}
          <div className="flex-shrink-0">
            <img
              src="https://raw.githubusercontent.com/kphotone-research/Images-kphotone/main/Logo.png"
              alt="Logo"
              className="w-32 md:w-40 h-auto"
            />
          </div>

          {/* Right Side: User Profile & Dropdown */}
          <div className="flex items-center gap-3 relative">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-900 leading-none">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 mt-1">Total redemption Points: <span className="font-bold">{approvedRequests.reduce((sum, request) => sum + request.points, 0).toLocaleString()}</span></p>
            </div>

            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              {/* Modern Avatar Circle from Mockup */}
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-800 flex items-center justify-center text-white text-xs font-bold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="text-gray-400 text-[10px]">▼</span>
            </button>

            {showDropdown && (
              <div
                ref={dropdownRef}
                className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in duration-200"
              >
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Account</p>
                  <p className="text-sm text-gray-900 font-medium truncate">{user?.email}</p>
                </div>

                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Speciality</p>
                  <p className="text-sm text-gray-700">{user?.speciality}</p>
                </div>

                <div className="px-2 pt-2">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>


      {/* Main content with left-side menu */}
      <div className="min-h-screen pt-20 pb-12 px-4 md:px-6 lg:px-8" style={{ background: "#f8fafc", backgroundImage: "radial-gradient(#e2e8f0 0.5px, transparent 0.5px)", backgroundSize: "20px 20px" }}>
        <div className="max-w-7xl mx-auto">

          {/* Notification Area */}
          {notification && (
            <div className={`mb-6 p-4 rounded-xl border-l-4 shadow-sm text-sm animate-in fade-in slide-in-from-top-2 ${notificationType === "success" ? "bg-green-50 text-green-800 border-green-500" :
                notificationType === "warning" ? "bg-yellow-50 text-yellow-800 border-yellow-500" :
                  "bg-red-50 text-red-800 border-red-500"
              }`}>
              <div className="flex items-center gap-2">
                <span className="font-bold uppercase text-[10px] tracking-widest">{notificationType}</span>
                <p>{notification}</p>
              </div>
            </div>
          )}

          {/* Welcome Header */}
          <header className="mb-8">
            <h1 className="text-3xl font-light text-slate-900">
              Welcome back, <span className="font-bold">{user?.name.split(" ")[0] || "User"}</span>
            </h1>
            <p className="text-slate-500 mt-1">Thank you for being a valued member of the Kphotone Research Physician Panel.</p>
          </header>

          {/* Main Stats & Redeem Section */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-4">

            {/* Available Points Card */}
           <div className="relative overflow-hidden bg-gradient-to-br from-cyan-50 to-blue-200 p-8 rounded-2xl border border-cyan-100 shadow-sm flex flex-col justify-between min-h-[180px]">
  <div className="relative z-10">
    <p className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-1">
      Available Points
    </p>

    <p className="text-6xl font-black text-blue-900">
      {availablePoints.toLocaleString()}
    </p>

    <p className="text-xs text-blue-500 mt-2 font-medium">
      Value: {(availablePoints / 100).toFixed(2)} <br/><i className="text-slate-600 text-sm">equivalent to local currency</i>
    </p>
  </div>

  {/* Background Icon */}
  <div className="absolute right-[-10%] bottom-[-10%] opacity-10 rotate-12 text-blue-900">
    <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  </div>
</div>

            {/* Pending Points Card */}
            <div className="bg-gradient-to-br from-cyan-50 to-blue-200 p-8 rounded-2xl border border-cyan-100 shadow-sm flex flex-col justify-between min-h-[180px] p-8 rounded-2xl border border-slate-300 shadow-sm flex flex-col justify-center items-center text-center">
              <p className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-1">Under Reviews Points</p>
              <p className="text-5xl font-black text-blue-900">
                {pendingRequests.reduce((sum, request) => sum + request.points, 0).toLocaleString()}
              </p>
               <p className="text-xs text-blue-500 mt-2 font-medium">Value: {(pendingRequests.reduce((sum, request) => sum + request.points, 0) / 100).toFixed(2)} <br/><i className="text-slate-600 text-sm">equivalent to local currency</i></p>
              <p className="text-xs text-slate-500 mt-12 font-medium mt-4 italic w-full">Rewards are typically approved within 5–10 business days <br/> after survey completion</p>
            </div>

            {/* Redeem Section */}
            <div className="bg-gradient-to-br from-cyan-50 to-blue-200 p-8 rounded-2xl border border-cyan-100 shadow-sm">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest ">Redeem Your Honorarium</h3>
              <p className="text-sm text-slate-800 mb-4">Select a rewarded survey to redeem your points</p>
              <div className="flex items-center justify-between mb-2">
                <button type="button" onClick={() => setSelectedRedeemSurveyId("__ALL__")}
                  disabled={filteredSurveys.length === 0}
                  className={`text-xs font-semibold ${filteredSurveys.length === 0
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-blue-600 hover:text-blue-700"
                    }`} >
                  Select All Rewarded Points
                </button>
                {eligibleSurveys.length > 0 && (
                  <span className="text-xs text-gray-500">Eligible total: {eligibleTotalPoints} pts</span>
                )}
              </div>

              <div className="space-y-4">
                <div className="relative">





                  <select
                    value={selectedRedeemSurveyId}
                    onChange={(e) => setSelectedRedeemSurveyId(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:ring-2 focus:ring-cyan-400 outline-none transition-all"
                    disabled={filteredSurveys.length === 0}
                  >
                    <option value="">Select a rewarded survey</option>
                    {eligibleSurveys.length > 0 && (
                      <option value="__ALL__">Redeem All ({eligibleTotalPoints} pts)</option>
                    )}
                    {eligibleSurveys.map((survey) => (
                      <option key={survey._id} value={survey._id}>
                        {survey.title} ({survey.rewardPoints} pts)
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-3.5 pointer-events-none text-slate-400">▼</div>
                </div>

                <button
                  onClick={handleRedeem}
                  disabled={filteredSurveys.length === 0 || !selectedRedeemSurveyId}
                  className={`w-full py-3 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg hover:shadow-cyan-200/50 ${!selectedRedeemSurveyId ? "bg-slate-300 text-slate-500 cursor-not-allowed" : "bg-blue-900 text-white hover:bg-black active:scale-[0.98]"
                    }`}
                  style={selectedRedeemSurveyId ? { boxShadow: "0 4px 14px 0 rgba(0, 229, 255, 0.39)" } : {}}
                >
                  REDEEM NOW
                </button>
              </div>
            </div>
          </section>

          <p className="text-sm text-gray-500 mb-4">
           <b>Note:</b> Some rewards may still be under review.
Your points will become redeemable once verification is completed by our administrators.
          </p>

          {/* Tabs Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex  bg-gradient-to-br from-cyan-50 to-blue-200  m px-2">
              {["assignedSurveys", "completedSurveys", "redemptionLogs"].map((tab) => (
                <button
                  key={tab}
                  className={`px-6 py-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${activeTab === tab ? "border-blue-900 text-slate-900 bg-gradient-to-br from-cyan-100 to-blue-300"  : "border-transparent text-slate-400 hover:text-slate-600"
                    }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.replace(/([A-Z])/g, ' $1')}
                </button>
              ))}
            </div>

            <div className="p-2">
              <div className="overflow-x-auto">

                {/* Dynamic Content Based on Tab */}
                {activeTab === "assignedSurveys" && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="text-[10px] text-slate-400 font-black uppercase tracking-widest border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4">Description</th>
                          {/* <th className="px-6 py-4">Details / Link</th> */}
                          <th className="px-6 py-4">Date</th>
                          <th className="px-6 py-4 text-right">Points</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-slate-50">
                        {surveys.map((s) => (
                          <tr key={s._id} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="px-6 py-4 font-semibold text-slate-700">{s.surveyCode ? `${s.surveyCode} - ${s.title}` : s.title}</td>
                            {/* <td className="px-6 py-4 text-cyan-600 hover:underline cursor-pointer">{s.surveyLink}</td> */}
                            <td className="px-6 py-4 text-slate-400">{new Date(s.endDate).toLocaleDateString()}</td>
                            <td className="px-6 py-4 text-right font-bold text-slate-900">{s.rewardPoints}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {activeTab === "completedSurveys" && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="text-[10px] text-slate-400 font-black uppercase tracking-widest border-b border-gray-200">
                        <tr>
                          <th className="px-6 py-4">Date</th>
                          <th className="px-6 py-4">Survey</th>
                          <th className="px-6 py-4">Points</th>
                          <th className="px-6 py-4">Status</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm divide-y divide-slate-50">
                        {filteredSurveys.slice(0, 3).map((survey) => {
                          console.log("All assigned surveys:", survey); // Log each survey object
                          return (
                            <tr key={survey._id} className="hover:bg-slate-50/80 transition-colors group">
                              <td className="px-6 py-4 font-medium">
                                {new Date(survey.endDate).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 font-medium">{survey.surveyCode ? `${survey.surveyCode} - ${survey.title}` : survey.title}</td>
                              <td className="px-6 py-4 font-medium">{survey.rewardPoints}</td>
                              <td className="px-6 py-4 text-gray-600 capitalize">
                                <span
                                 className={`px-3 py-1 rounded text-sm font-medium ${
                                survey.assignmentStatus === "rewarded"
                                  ? "bg-green-50 border-green-500 text-green-600 border"
                                  : "bg-blue-50 border-blue-500 text-blue-600 border"
                              }`}
                            >
    {survey.assignmentStatus === "rewarded"
      ? "Completed"
      : survey.assignmentStatus}
  </span>
                              </td>
                            </tr>
                          );
                        })}



                      </tbody>
                    </table>

                    {filteredSurveys.length === 0 && (
                      <p className="text-gray-500 mt-4 text-md text-center">No any rewarded surveys yet.</p>
                    )}
                  </div>

                )}

                {activeTab === "redemptionLogs" && (

                  <div className="overflow-y-auto max-h-96 px-2">


                    <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-1"> Pending Requests</h3>
                    {/* <p className="text-sm italic mb-4">Total Pending Points: {pendingRequests.reduce((sum, request) => sum + request.points, 0)}&nbsp; (when admin approved its will be deducted from your points)</p> */}
                    <p className="text-xs text-slate-500 tracking-widest mt-2 ">when admin approved its will be deducted from your points</p>
                    <hr className="my-2 border-gray-300 mb-4" />
                    {pendingRequests.length > 0 ? (
                      <table className="w-full text-left">
                        <thead className="text-[10px] text-slate-400 font-black uppercase tracking-widest border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-4">Survey</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Points</th>
                            <th className="px-6 py-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-slate-50">
                          {pendingRequests.map((request) => (
                            <tr key={request._id} className="hover:bg-slate-50/80 transition-colors group">
                              <td className="px-6 py-4 font-medium">
                                {request.assignedSurvey
                                  ? `${request.assignedSurvey.surveyCode || "-"} - ${request.assignedSurvey.title || ""}`
                                  : request.assignedSurveys?.length
                                    ? `All rewarded surveys (${request.assignedSurveys.length})`
                                    : "-"}
                              </td>
                              <td className="px-6 py-4 font-medium">{new Date(request.createdAt).toLocaleDateString()}</td>
                              <td className="px-6 py-4 font-medium">{request.points}</td>
                              <td className="px-6 py-4 font-medium capitalize"><span className="bg-red-50 border-red-500 text-red-600 border px-3 py-1 rounded text-sm font-medium">
                                {request.status === "pending" ? "Under Review" : request.status}
                                </span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-gray-500 mt-4 text-md text-center">No pending requests.</p>
                    )}

                    <hr className="my-4 border-gray-300" />

                    <h3 className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">Approved Requests</h3>
                    {/* <p className="mb-4 text-sm italic">Total Approved Points Till Date: {approvedRequests.reduce((sum, request) => sum + request.points, 0)}</p> */}
                    <hr className="my-2 border-gray-300" mb-4 />
                    {approvedRequests.length > 0 ? (
                      <>
                        <table className="w-full text-left">
                          <thead className="text-[10px] text-slate-400 font-black border-b border-gray-200 uppercase tracking-widest">
                            <tr>
                              <th className="px-6 py-4">Survey</th>
                              <th className="px-6 py-4">Date</th>
                              <th className="px-6 py-4">Points</th>
                              <th className="px-6 py-4">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {approvedRequests.map((request) => (
                              <tr key={request._id} >
                                <td className="px-6 py-4 font-medium">
                                  {request.assignedSurvey
                                    ? `${request.assignedSurvey.surveyCode || "-"} - ${request.assignedSurvey.title || ""}`
                                    : request.assignedSurveys?.length
                                      ? `All rewarded surveys (${request.assignedSurveys.length})`
                                      : "-"}
                                </td>
                                <td className="px-6 py-4 font-medium">
                                  {new Date(request.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 font-medium">{request.points}</td>
                                <td className="px-6 py-4 font-medium capitalize"><span className="bg-green-50 border-green-500 text-green-600 border px-3 py-1 rounded text-sm font-medium">{request.status}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                      </>
                    ) : (
                      <p className="text-gray-500 mt-4 text-md text-center">No approved requests.</p>
                    )}
                  </div>
                )}
                {/* Empty State */}
                {surveys.length === 0 && (
                  <div className="py-20 text-center">
                    <p className="text-slate-400 italic">No data available for this section.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center space-y-3">

    {/* Links */}
    <div className="flex items-center space-x-3 text-sm text-gray-600">
      <a
        href="https://www.keptone.com/privacy-policy.html"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-blue-600 transition"
      >
        Privacy Policy
      </a>

      <span className="text-gray-400">|</span>

      <a
        href="https://www.kphotone.com/term.html"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-blue-600 transition"
      >
        Terms & Conditions
      </a>
    </div>
    <p className="font-bold text-gray-500 ">Kphotone Research</p>

    {/* Copyright */}
    <div className="text-xs text-gray-500 text-center">
      © {new Date().getFullYear()} Kphotone Research. All rights reserved.
    </div>

  </div>
</footer>
    </div>
  );
}

export default UserDashboard;
