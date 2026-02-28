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
      fetchProfile(); // auto refresh
    }, 5000); // every 5 seconds

    return () => clearInterval(interval);
  }, []);

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
      <header className="bg-white px-4 md:px-6 py-2 border-b border-gray-300 fixed top-0 left-0 w-full z-10">
        <div className="flex justify-between items-center px-4">
          <img
            src="https://raw.githubusercontent.com/kphotone-research/Images-kphotone/main/Logo.png"
            alt="Logo"
            className="w-36 md:w-48 h-auto" // Responsive logo size
          />
          <div className="lex items-center relative">
            <span className="text-xs md:text-sm text-gray-950 mr-1 md:mr-2  text-gray-600 font-semibold capitalize truncate max-w-25 md:max-w-none">
              {user?.name}
            </span>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className=" text-gray-400 px-2 py-1 rounded text-[10px] md:text-[12px]"
            >
              ▼
            </button>
            {showDropdown && (
              <div
                ref={dropdownRef}
                className="absolute right-0 mt-2 w-48 bg-white border border-gray-300 rounded shadow-lg z-50"
                style={{ top: "100%" }}
              >
                <div className="px-4 py-2 text-xs md:text-sm text-gray-600 border-b border-gray-300">
                  <span className="font-semibold">Email: </span><br />
                  {user?.email}</div>
                <div className="px-4 py-2 text-xs md:text-sm text-gray-600 border-b border-gray-300">
                  <span className="font-semibold">Speciality: </span><br />
                  {user?.speciality}</div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2  font-semibold text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content with left-side menu */}
      <div className="flex flex-col md:flex-row flex-1 mt-12 p-4 md:p-6 gap-6" style={{ background: "#f1f5f9" }}>


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

          {/* Welcome Message */}
          <div className=" w-full bg-white p-4 rounded-lg shadow-md ">
            <div>
              <h1 className="text-xl font-bold text-gray-950">Reward Points Summary</h1>
              <p className="text-xs md:text-sm text-gray-600 ">Your rewards and surveys are ready.</p>
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
                          console.log(survey); // Log each survey object
                        
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
                    {/* Completed Surveys Table */}

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
                          //console.log(survey); // Log each survey object
                          return (
                            <tr key={survey._id} className="hover:bg-gray-50">
                              <td className="py-3 px-4 font-medium">
                                {new Date(survey.endDate).toLocaleDateString()}
                              </td>
                              <td className="py-3 px-4 font-medium">{survey.surveyCode ? `${survey.surveyCode} - ${survey.title}` : survey.title}</td>
                              <td className="py-3 px-4 font-medium">{survey.rewardPoints}</td>
                              <td className="py-3 px-4 text-gray-600 capitalize">
                                <span
                                  className={`px-3 py-1 rounded text-sm font-medium ${survey.status === "active"
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
  );
}

export default UserDashboard;
