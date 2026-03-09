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

   //console.log("filteredSurveys:", filteredSurveys);
  // console.log("eligibleSurveys:", eligibleSurveys);
  // console.log("selectedRedeemSurveyId:", selectedRedeemSurveyId);
  // console.log("All surveys:", surveys);

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
        <p className="text-xs text-gray-500 mt-1">Available Points: 2,450</p>
      </div>

      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
      >
        {/* Modern Avatar Circle from Mockup */}
        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs font-bold">
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
      <div className={`mb-6 p-4 rounded-xl border-l-4 shadow-sm text-sm animate-in fade-in slide-in-from-top-2 ${
        notificationType === "success" ? "bg-green-50 text-green-800 border-green-500" : 
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
      <p className="text-slate-500 mt-1">Your Insights, Your Rewards.</p>
    </header>

     {/* Main Stats & Redeem Section */}
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
      
      {/* Available Points Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-slate-200 p-8 rounded-2xl border border-white shadow-sm flex flex-col justify-between min-h-[180px]">
        <div className="relative z-10">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Available Points</p>
          <p className="text-5xl font-black text-slate-800">
            {user?.points?.toLocaleString() ?? 0}
          </p>
          <p className="text-xs text-slate-500 mt-2 font-medium">Value: ${(user?.points / 100).toFixed(2)} equivalent</p>
        </div>
        {/* Subtle background icon/graph */}
        <div className="absolute right-[-10%] bottom-[-10%] opacity-10 rotate-12">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
        </div>
      </div>

      {/* Pending Points Card */}
      <div className="bg-gradient-to-br from-slate-200 to-slate-300 p-8 rounded-2xl border border-slate-300 shadow-sm flex flex-col justify-center items-center text-center">
        <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">Pending Points</p>
        <p className="text-4xl font-black text-slate-700">
          {pendingRequests.reduce((sum, request) => sum + request.points, 0).toLocaleString()}
        </p>
        <p className="text-[10px] text-slate-600 mt-4 italic max-w-[180px]">Verification in progress by administrators</p>
      </div>

      {/* Redeem Section */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4">Redeem Points</h3>
         <div className="flex items-center justify-between mb-2">
          <button   type="button" onClick={() => setSelectedRedeemSurveyId("__ALL__")}
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
            className={`w-full py-3 rounded-xl font-bold text-sm tracking-wide transition-all shadow-lg hover:shadow-cyan-200/50 ${
              !selectedRedeemSurveyId ? "bg-slate-300 text-slate-500 cursor-not-allowed" : "bg-slate-900 text-white hover:bg-black active:scale-[0.98]"
            }`}
            style={selectedRedeemSurveyId ? { boxShadow: "0 4px 14px 0 rgba(0, 229, 255, 0.39)" } : {}}
          >
            REDEEM NOW
          </button>
        </div>
      </div>
    </section>

     {/* Tabs Section */}
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex border-b border-slate-100 bg-slate-50/50 px-2">
        {["assignedSurveys", "completedSurveys", "redemptionLogs"].map((tab) => (
          <button
            key={tab}
            className={`px-6 py-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
              activeTab === tab ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"
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
                     <thead className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                        <tr>
                          <th className="px-6 py-4">Description</th>
                          <th className="px-6 py-4">Details / Link</th>
                          <th className="px-6 py-4">Date</th>
                          <th className="px-6 py-4 text-right">Points</th>
                        </tr>
                     </thead>
                     <tbody className="text-sm divide-y divide-slate-50">
                      {surveys.map((s) => (
                        <tr key={s._id} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="px-6 py-4 font-semibold text-slate-700">{s.surveyCode ? `${s.surveyCode} - ${s.title}` : s.title}</td>
                          <td className="px-6 py-4 text-cyan-600 hover:underline cursor-pointer">{s.surveyLink}</td>
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
                       <thead className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
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
  {survey.assignmentStatus}
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
                     <p className="text-xs text-slate-500 mt-2 font-medium">when admin approved its will be deducted from your points</p>
                     <hr className="my-2 border-gray-300"  mb-4 />
                    {pendingRequests.length > 0 ? (
                      <table className="w-full text-left">
                       <thead className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
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
                              <td className="px-6 py-4 font-medium capitalize">{request.status}</td>
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
                     <hr className="my-2 border-gray-300"  mb-4 />
                    {approvedRequests.length > 0 ? (
                      <>
                       <table className="w-full text-left">
                       <thead className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
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
                                <td className="px-6 py-4 font-medium capitalize">{request.status}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                      </>
                    ) : (
                      <p className="text-sm text-center">No approved requests.</p>
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





        {/* Left-side menu */}
        <main className="flex-1 p-4 md:p-6 order-1 md:order-0">
          {/* Notification */}
          {notification && (
            <div
              className={`mb-4 p-4 rounded border text-sm ${notificationType === "success"
                ? "bg-green-100 text-green-800 border-green-300"
                : notificationType === "warning"
                  ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                  : "bg-red-100 text-red-800 border-red-300"
                }`}
            >
              {notification}
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-950 mb-1">Welcome back, {user?.name.split(" ")[0] || "User"}!</h1>
          <p className="text-xs text-gray-600 mb-4">Here's a summary of your rewards and surveys.</p>
          {/* Welcome Message */}
          <div className=" w-full bg-white p-4 rounded-lg shadow-md ">

          
            <div>
              <h1 className="text-xl font-bold text-gray-950">Reward Points Summary</h1>
              {/* <p className="text-xs md:text-sm text-gray-600 ">Your rewards and surveys are ready.</p> */}
            </div>
            <hr className="border-gray-300 mt-4 mb-4" />
            {/* Stats Section: Stacks vertically on small screens */}
            {/* <p className="text-gray-600 text-lg uppercase tracking-wider mb-1 mt-6">Reward Points Summary</p> */}
            <div className="flex gap-4">
              {/* Reward Card */}

              {/* <div className="bg-blue-600 p-8  shadow-md text-center flex flex-col justify-center w-md lg:w-1/3 rounded-xl text-white">
            <p className="text-blue-100 text-lg uppercase tracking-wider mb-1">Total Earned </p>
            <p className="font-bold text-4xl">
            {totalEarnedPoints}
            </p>
          </div>
          */}
              <div className="flex w-1/2  gap-5  ">
                <div className="  w-1/2 relative border border-gray-300 text-center flex flex-col justify-center w-md lg:w-1/3 rounded-xl text-white" style={{ "width": "50%" }}>
                  <p className="text-sm md:text-sm text-gray-950   tracking-wider mb-1">Avilable Points </p>
                  <p className="font-bold text-4xl text-gray-950">
                    {user?.points ?? 0}
                  </p>
                  console.log("User points:", user?.points);
                </div>
                <div className=" relative w-1/2 border border-gray-300 text-center flex flex-col justify-center w-md lg:w-1/3 rounded-xl text-white" style={{ "width": "50%" }}>
                  <p className="text-sm md:text-sm text-gray-950   tracking-wider mb-1">Pending Points </p>
                  <p className="font-bold text-4xl text-gray-950">
                    {pendingRequests.reduce((sum, request) => sum + request.points, 0)}
                  </p>
                  <p className="w-full text-xs text-gray-500 italic text-center absolute bottom-2">when admin approved its will be deducted from avilable points</p>
                </div>
              </div>


              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm w-full lg:flex-1 w-3/5 justify-start ">
                <h3 className="mb-3 font-semibold text-lg text-gray-700">Redeem Points</h3>
                <div className="flex items-center justify-between mb-2">
                  <button
                    type="button"
                    onClick={() => setSelectedRedeemSurveyId("__ALL__")}
                    disabled={filteredSurveys.length === 0}
                    className={`text-xs font-semibold ${filteredSurveys.length === 0
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-blue-600 hover:text-blue-700"
                      }`}
                  >
                    Select All Rewarded Points
                  </button>
                  {eligibleSurveys.length > 0 && (
                    <span className="text-xs text-gray-500">Eligible total: {eligibleTotalPoints} pts</span>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={selectedRedeemSurveyId}
                    onChange={(e) => setSelectedRedeemSurveyId(e.target.value)}
                    className="py-4 px-4 bg-gray-50 rounded border border-gray-300 w-full outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={filteredSurveys.length === 0}
                  >
                    <option value="">
                      {eligibleSurveys.length === 0 ? "No eligible surveys available" : "Select rewarded survey"}
                    </option>
                    {eligibleSurveys.length > 0 && (
                      <option value="__ALL__">All eligible surveys ({eligibleTotalPoints} pts)</option>
                    )}
                    {eligibleSurveys.map((survey) => (
                      <option key={survey._id} value={survey._id}>
                        {survey.surveyCode ? `${survey.surveyCode} - ${survey.title}` : survey.title} ({survey.rewardPoints} pts)
                      </option>
                    ))}
                  </select>

                  
                  <button
                    onClick={handleRedeem}
                    disabled={filteredSurveys.length === 0 || !selectedRedeemSurveyId}
                    className={`whitespace-nowrap px-6 py-2 rounded text-sm font-bold text-white transition-colors ${filteredSurveys.length === 0 || !selectedRedeemSurveyId ? "bg-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                      }`}
                  >
                    Redeem Now
                  </button>
                </div>
                
                <div className="flex justify-between items-center mt-2">
                  {/* <p className="text-xs text-gray-500">Available: <b>{user?.points ?? 0}</b></p> */}
                  {filteredSurveys.length === 0 && (
                    <p className="text-red-500 italic text-md">No rewarded surveys available</p>
                  )}
                </div>
              </div>



            </div>
          </div>

          {/* Tabs for Completed Surveys and Redemption Logs */}
          <div className="mb-4 mt-8 bg-white p-5 rounded-xl border border-gray-200 shadow-sm ">
            <div className="flex border-b border-gray-300 overflow-x-auto">
              <button
                className={`whitespace-nowrap px-6 py-3 text-md font-bold transition-all ${activeTab === "assignedSurveys" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-400"
                  }`}
                onClick={() => setActiveTab("assignedSurveys")}
              >
                Assigned Surveys
              </button>
              <button
                className={`whitespace-nowrap px-6 py-3 text-md font-bold transition-all ${activeTab === "completedSurveys" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-400"
                  }`}
                onClick={() => setActiveTab("completedSurveys")}
              >
                Rewarded Surveys Points
              </button>

              <button
                className={`whitespace-nowrap px-6 py-3 text-md font-bold transition-all ${activeTab === "redemptionLogs" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-400"
                  }`}
                onClick={() => setActiveTab("redemptionLogs")}
              >
                Redemption Points Logs
              </button>

            </div>
            <div>
              {/* Scrollable Table Container */}
              <div className="overflow-x-auto  bg-white"></div>

              {activeTab === "assignedSurveys" && (
                <div>
                  {/* <h3 className="text-md font-bold">Completed Surveys</h3> */}
                  {/* <h2 className="text-sm italic mb-4">
                  Total Earned Points (Till Date): {totalEarnedPoints}
                </h2> */}
                  <div className="overflow-y-auto max-h-96">
                    {/* Completed Surveys Table */}

                    <table className="w-full text-sm text-left text-md">
                      <thead className="bg-gray-50 text-gray-700 uppercase text-[10px] font-bold border-b">
                        <tr>
                          
                           <th className="py-3 px-4 text-md">Survey</th>
                          <th className="py-3 px-4 text-md">Survey Link</th>
                          <th className="py-3 px-4 text-md">Expired Date</th>
                          <th className="py-3 px-4 text-md">Points</th>

                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {surveys.slice(0, 3).map((survey) => {
                          //console.log(survey); // Log each survey object
                        
                          return (
                            <tr key={survey._id} className="hover:bg-gray-50">
                 
                              <td className="py-3 px-4 text-md font-medium">{survey.surveyCode} - {survey.title}</td>
                              <td className="py-3 px-4 text-md font-medium"> {survey.surveyLink}</td>
                              <td className="py-3 px-4 text-md font-medium">{survey.endDate ? new Date(survey.endDate).toLocaleDateString(): "No End Date"}</td>
                              <td className="py-3 px-4 text-md font-medium">{survey.rewardPoints}</td>

                            </tr>
                            
                          );
                        })}



                      </tbody>
                      
                    </table>

                    {surveys.length === 0 && (
                      <p className="text-gray-500 mt-4 text-md text-center">No surveys assigned</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "completedSurveys" && (
                <div>
                  {/* <h3 className="text-md font-bold">Completed Surveys</h3> */}
                  {/* <h2 className="text-sm italic mb-4">
                  Total Earned Points (Till Date): {totalEarnedPoints}
                </h2> */}
                  <div className="overflow-y-auto max-h-96">
                   

                    <table className="w-full text-sm text-left text-md">
                      <thead className="bg-gray-50 text-gray-700 uppercase text-[10px] font-bold border-b">
                        <tr>
                           <th className="py-3 px-4 text-md">Date</th>
                            
                          <th className="py-3 px-4 text-md ">Survey</th>
                          <th className="py-3 px-4 text-md ">Points</th>
                          <th className="py-3 px-4 text-md ">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredSurveys.slice(0, 3).map((survey) => {
                          console.log("All assigned surveys:", survey); // Log each survey object
                          return (
                            <tr key={survey._id} className="hover:bg-gray-50">
                              <td className="py-3 px-4 font-medium">
                                {new Date(survey.endDate).toLocaleDateString()}
                              </td>
                              <td className="py-3 px-4 font-medium">{survey.surveyCode ? `${survey.surveyCode} - ${survey.title}` : survey.title}</td>
                              <td className="py-3 px-4 font-medium">{survey.rewardPoints}</td>
                              <td className="py-3 px-4 text-gray-600 capitalize">
                                <span
  className={`px-3 py-1 rounded text-sm font-medium ${
    survey.assignmentStatus === "rewarded"
      ? "bg-green-50 border-green-500 text-green-600 border"
      : "bg-blue-50 border-blue-500 text-blue-600 border"
  }`}
>
  {survey.assignmentStatus}
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
                </div>
              )}

              {activeTab === "redemptionLogs" && (
                <section className="mt-4">
                  {/* <h2 className="text-md font-bold">Redemption Requests Logs</h2> */}
                  <div className="overflow-y-auto max-h-96">
                    {/* <hr className="my-2 border-gray-300" /> */}

                    <h3 className="text-lg font-semibold ">
                      Pending Requests
                    </h3>
                    {/* <p className="text-sm italic mb-4">Total Pending Points: {pendingRequests.reduce((sum, request) => sum + request.points, 0)}&nbsp; (when admin approved its will be deducted from your points)</p> */}
                     <p className="text-md text-amber-950 ">when admin approved its will be deducted from your points</p>
                     <hr className="my-2 border-gray-300"  mb-4 />
                    {pendingRequests.length > 0 ? (
                      <table className="w-full text-sm border border-gray-300 border-b-0 rounded-lg shadow-sm">
                        <thead className="bg-gray-100 border-b border-gray-300">
                          <tr>
                            <th className="py-2 px-4 text-left border-r border-gray-300 font-semibold text-gray-700">Survey</th>
                            <th className="py-2 px-4 text-left border-r border-gray-300 font-semibold text-gray-700">Date</th>
                            <th className="py-2 px-4 text-left border-r border-gray-300 font-semibold text-gray-700">Points</th>
                            <th className="py-2 px-4 text-left font-semibold text-gray-700">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {pendingRequests.map((request) => (
                            <tr key={request._id} className="border-b">
                              <td className="py-2 px-4 border-r border-gray-300 text-gray-800">
                                {request.assignedSurvey
                                  ? `${request.assignedSurvey.surveyCode || "-"} - ${request.assignedSurvey.title || ""}`
                                  : request.assignedSurveys?.length
                                    ? `All rewarded surveys (${request.assignedSurveys.length})`
                                    : "-"}
                              </td>
                              <td className="py-2 px-4 border-r border-gray-300 text-gray-800">{new Date(request.createdAt).toLocaleDateString()}</td>
                              <td className="py-2 px-4 border-r border-gray-300 text-gray-800">{request.points}</td>
                              <td className="py-2 px-4 text-gray-800 capitalize">{request.status}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-gray-500 mt-4 text-md text-center">No pending requests.</p>
                    )}

                    <hr className="my-4 border-gray-300" />

                    <h3 className="text-lg font-semibold ">Approved Requests</h3>
                    {/* <p className="mb-4 text-sm italic">Total Approved Points Till Date: {approvedRequests.reduce((sum, request) => sum + request.points, 0)}</p> */}
                     <hr className="my-2 border-gray-300"  mb-4 />
                    {approvedRequests.length > 0 ? (
                      <>
                        <table className="w-full text-sm border border-gray-300 border-b-0 rounded-lg shadow-sm">
                          <thead className="bg-gray-100 border-b border-gray-300">
                            <tr>
                              <th className="py-2 px-4 text-left border-r border-gray-300 text-gray-800 font-semibold">Survey</th>
                              <th className="py-2 px-4 text-left border-r border-gray-300 text-gray-800 font-semibold">Date</th>
                              <th className="py-2 px-4 text-left border-r border-gray-300 font-semibold text-gray-700">Points</th>
                              <th className="py-2 px-4 text-left font-semibold text-gray-700">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {approvedRequests.map((request) => (
                              <tr key={request._id} className="border-b">
                                <td className="py-2 px-4 border-r border-gray-300 text-gray-800">
                                  {request.assignedSurvey
                                    ? `${request.assignedSurvey.surveyCode || "-"} - ${request.assignedSurvey.title || ""}`
                                    : request.assignedSurveys?.length
                                      ? `All rewarded surveys (${request.assignedSurveys.length})`
                                      : "-"}
                                </td>
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
                      <p className="text-sm text-center">No approved requests.</p>
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
    </div>
  );
}

export default UserDashboard;
