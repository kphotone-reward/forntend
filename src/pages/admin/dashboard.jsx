import { useEffect, useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../api/axios"
import CreateUserModal from "./createUserModal";
import EditUserModal from "./EditUserModal";
// import AddPointsModal from "./AddPointsModal";


function AdminDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  // const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [totalPages, setTotalPages] = useState(1)
  const [surveySearch, setSurveySearch] = useState("")
  const [surveyPage, setSurveyPage] = useState(1)
  const [surveyLimit, setSurveyLimit] = useState(10)
  const [surveyTotalPages, setSurveyTotalPages] = useState(1)
  const [showAddPointsModal, setShowAddPointsModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [editUser, setEditUser] = useState(null);
  const [pointsToAdd, setPointsToAdd] = useState("")
  const [openCreateUser, setOpenCreateUser] = useState(false);
  const [filterActive, setFilterActive] = useState(true); // State to toggle active/inactive filter

  const [users, setUsers] = useState([])
  const [surveys, setSurveys] = useState([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalSurveys: 0,
    totalAssignments: 0,
    totalPointsDistributed: 0
  })
  const [redeemStats, setRedeemStats] = useState({
  totalRedemptions: 0,
  pendingRedemptions: 0,
  approvedRedemptions: 0,
  rejectedRedemptions: 0
})

const [redeemSearch, setRedeemSearch] = useState("");
const [redeemPage, setRedeemPage] = useState(1);
const [redeemLimit, setRedeemLimit] = useState(10);
const [redeemTotalPages, setRedeemTotalPages] = useState(1);
const [redemptionRequests, setRedemptionRequests] = useState([]);


  // Form states
  const [newSurvey, setNewSurvey] = useState({
    title: "",
    surveyLink: "",
    rewardPoints: "",
    startDate: "",
    endDate: ""
  })
  const [assignSurvey, setAssignSurvey] = useState({
    userIds: [],
    surveyId: ""
  })
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  // Modal and detail states
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedSurvey, setSelectedSurvey] = useState(null)
  const [assignedUsers, setAssignedUsers] = useState([])

  const [showEditModal, setShowEditModal] = useState(false)
  const [editSurvey, setEditSurvey] = useState({
    id: "",
    title: "",
    surveyLink: "",
    rewardPoints: "",
    startDate: "",
    endDate: ""
  })


  const fetchRedeemRequests = useCallback(async () => {
  try {
    const res = await api.get("/redemption/admin/requests");

    console.log("Admin redemption requests:", res.data);

    setRedemptionRequests(res.data.requests || []);
  } catch (err) {
    console.error(
      "Failed to fetch redemption requests",
      err.response?.status,
      err.response?.data
    );
  }
}, []);




const handleAddPoints = async () => {
  if (!pointsToAdd || pointsToAdd <= 0) {
    setErrorMessage("Please enter valid points")
    return
  }

  try {
    await api.post(
      `/auth/users/${selectedUser._id}/add-points`,
      { points: Number(pointsToAdd) }
    )

    setShowAddPointsModal(false)
    setPointsToAdd("")
    setSelectedUser(null)

    fetchUsers() // refresh table
  } catch (err) {
    setErrorMessage("Failed to add points")
  }
}


  // Fetch profile on mount
  // useEffect(() => {
  //   const fetchProfile = async () => {
  //     try {
  //       const res = await api.get("/auth/profile",  {
  //         headers: {
  //           Authorization: `Bearer ${localStorage.getItem("token")}`,
  //         },
  //       });
  //       setUser(res.data.user);
  //     } catch (err) {
  //       console.error("Profile fetch failed", err);
  //       setErrorMessage("Failed to fetch profile");
  //     } finally {
  //       setLoading(false);
  //     }
  //   }

  //   fetchProfile()
  // }, [])

  // Clear messages after 3 seconds
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("")
        setErrorMessage("")
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [successMessage, errorMessage])

  // Fetch all users
  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get("/auth/users", {
        params: {
          search,
          page,
          limit,
          isActive: filterActive.toString(), // Convert boolean to string
        }
      })

      setUsers(res.data.users)
      setTotalPages(res.data.pages)
    } catch (err) {
      console.error("Failed to fetch users", err)
      setErrorMessage("Failed to fetch users")
    }
  }, [search, page, limit, filterActive]); // Add filterActive to dependencies

  // Fetch all surveys
  const fetchSurveys = useCallback(async () => {
    try {
      const res = await api.get("/survey/all", {
        params: {
          search: surveySearch,
          page: surveyPage,
          limit: surveyLimit
        }
      })
      setSurveys(res.data.surveys || [])
      setSurveyTotalPages(res.data.pages || 1)
    } catch (err) {
      console.error("Failed to fetch surveys", err)
      setErrorMessage("Failed to fetch surveys")
    }
  }, [surveySearch, surveyPage, surveyLimit])

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get("/survey/admin/stats")
      setStats(res.data)
    } catch (err) {
      console.error("Failed to fetch stats", err)
    }
  }, [])

  const fetchRedeemStats = useCallback(async () => {
  try {
    const res = await api.get("/redemption/stats");

    setRedeemStats({
      totalRedemptions: res.data.total,
      pendingRedemptions: res.data.pending,
      approvedRedemptions: res.data.approved,
      rejectedRedemptions: res.data.rejected
    });
  } catch (err) {
    console.error("Failed to fetch redemption stats", err);
  }
}, []);


  // Load data when overview tab is active
  useEffect(() => {
    if (activeTab === "overview") {
      fetchUsers()
      fetchSurveys()
      fetchStats()
      fetchRedeemStats();
      
    }
  }, [activeTab, fetchUsers, fetchSurveys, fetchStats, fetchRedeemStats])

// status filitered users
  const statusFilteredUsers = users.filter(
  (user) => Boolean(user.isActive) === filterActive
);


  // Fetch users when users tab is active or search/pagination changes
  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers()
    }
  }, [activeTab, fetchUsers])

 useEffect(() => {
  if (activeTab === "redeem") {
    fetchRedeemRequests();
  }
}, [activeTab, redeemSearch, redeemPage, redeemLimit, fetchRedeemRequests]);



  // Fetch surveys when surveys tab is active or search/pagination changes
  useEffect(() => {
    if (activeTab === "surveys") {
      fetchSurveys()
    }
  }, [activeTab, fetchSurveys])

  // Create survey handler
  const handleCreateSurvey = async (e) => {
    e.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")

    if (!newSurvey.title || !newSurvey.surveyLink || !newSurvey.rewardPoints || !newSurvey.startDate || !newSurvey.endDate) {
      setErrorMessage("All fields are required")
      return
    }

    const startDate = new Date(newSurvey.startDate)
    const endDate = new Date(newSurvey.endDate)

    if (startDate >= endDate) {
      setErrorMessage("End date must be after start date")
      return
    }

    try {
      const res = await api.post("/survey/create", {
        title: newSurvey.title,
        surveyLink: newSurvey.surveyLink,
        rewardPoints: parseInt(newSurvey.rewardPoints),
        startDate: newSurvey.startDate,
        endDate: newSurvey.endDate
      })

      setSuccessMessage("Survey created successfully!")
      setNewSurvey({ title: "", surveyLink: "", rewardPoints: "", startDate: "", endDate: "" })
      fetchSurveys()
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to create survey")
    }
  }

  // Assign survey handler
  const handleAssignSurvey = async (e) => {
    e.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")

    if (assignSurvey.userIds.length === 0 || !assignSurvey.surveyId) {
      setErrorMessage("Please select at least one user and a survey")
      return
    }

    try {
      const res = await api.post("/survey/assign-multiple", {
        userIds: assignSurvey.userIds,
        surveyId: assignSurvey.surveyId
      })

      setSuccessMessage(`Survey assigned to ${assignSurvey.userIds.length} user(s) successfully!`)
      setAssignSurvey({ userIds: [], surveyId: "" })
      fetchSurveys()
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to assign survey")
    }
  }

  // Pause survey handler
  const handlePauseSurvey = async (surveyId) => {
    try {
      await api.patch(`/survey/pause/${surveyId}`)
      setSuccessMessage("Survey paused successfully!")
      fetchSurveys()
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to pause survey")
    }
  }

  // Resume survey handler
  const handleResumeSurvey = async (surveyId) => {
    try {
      await api.patch(`/survey/resume/${surveyId}`)
      setSuccessMessage("Survey resumed successfully!")
      fetchSurveys()
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to resume survey")
    }
  }

  // View survey details
  const handleViewSurvey = async (survey) => {
    try {
      const res = await api.get(`/survey/${survey._id}/users`)
      setSelectedSurvey(survey)
      setAssignedUsers(res.data.users || [])
      setShowDetailModal(true)
    } catch (err) {
      console.error("Failed to fetch survey details", err)
      setErrorMessage("Failed to fetch survey details")
    }
  }

  // Open edit modal
  const handleEditSurvey = (survey) => {
    setEditSurvey({
      id: survey._id,
      title: survey.title,
      surveyLink: survey.surveyLink,
      rewardPoints: survey.rewardPoints,
      startDate: survey.startDate.split('T')[0],
      endDate: survey.endDate.split('T')[0]
    })
    setShowEditModal(true)
  }

  // Submit survey edit
  const handleSubmitEdit = async (e) => {
    e.preventDefault()
    setErrorMessage("")
    setSuccessMessage("")

    if (!editSurvey.title || !editSurvey.surveyLink || !editSurvey.rewardPoints || !editSurvey.startDate || !editSurvey.endDate) {
      setErrorMessage("All fields are required")
      return
    }

    if (isNaN(parseInt(editSurvey.rewardPoints)) || parseInt(editSurvey.rewardPoints) < 1) {
      setErrorMessage("Reward points must be a positive number")
      return
    }

    const startDate = new Date(editSurvey.startDate)
    const endDate = new Date(editSurvey.endDate)

    if (startDate >= endDate) {
      setErrorMessage("End date must be after start date")
      return
    }

    try {
      await api.patch(`/survey/${editSurvey.id}`, {
        title: editSurvey.title,
        surveyLink: editSurvey.surveyLink,
        rewardPoints: parseInt(editSurvey.rewardPoints),
        startDate: new Date(editSurvey.startDate).toISOString(),
        endDate: new Date(editSurvey.endDate).toISOString()
      })
      setSuccessMessage("Survey updated successfully!")
      setShowEditModal(false)
      fetchSurveys()
    } catch (err) {
      console.error("Error updating survey:", err)
      setErrorMessage(err.response?.data?.message || "Failed to update survey")
    }
  }


//  const [redemptionRequests, setRedeemRequests] = useState([]);



const approveRedeem = async (id) => {
  try {
    const res = await api.patch(`/redemption/${id}/approve`);

    setRedemptionRequests(prev =>
  prev.map(r => r._id === id ? { ...r, status: "approved" } : r)
);

    setSuccessMessage("Redemption approved successfully");
  } catch (err) {
    setErrorMessage(
      err.response?.data?.message || "Failed to approve redemption"
    );
  }
};

const rejectRedeem = async (id) => {
  try {
    const res = await api.patch(`/redemption/${id}/reject`);

    setRedeemRequests(prev =>
      prev.map(r =>
        r._id === id ? { ...r, status: "rejected" } : r
      )
    );

    setSuccessMessage("Redemption rejected");
  } catch (err) {
    setErrorMessage(
      err.response?.data?.message || "Failed to reject redemption"
    );
  }
};


  // Load redemption stats when overview tab is active  




  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("token")
    navigate("/login")
  }

  // if (loading) {
  //   return <div className="p-6 text-center">Loading...</div>
  // }



  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome, Admin</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-semibold transition"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white shadow mt-6 mx-6 rounded">
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-6 py-3 font-medium ${
              activeTab === "overview"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("users")}
            className={`px-6 py-3 font-medium ${
              activeTab === "users"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab("surveys")}
            className={`px-6 py-3 font-medium ${
              activeTab === "surveys"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Surveys
          </button>
          <button
            onClick={() => setActiveTab("create")}
            className={`px-6 py-3 font-medium ${
              activeTab === "create"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Create Survey
          </button>
          <button
            onClick={() => setActiveTab("assign")}
            className={`px-6 py-3 font-medium ${
              activeTab === "assign"
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Assign Survey
          </button>

          <button
  onClick={() => setActiveTab("redeem")}
  className={`px-6 py-3 font-medium ${
    activeTab === "redeem"
      ? "text-blue-600 border-b-2 border-blue-600"
      : "text-gray-600 hover:text-gray-800"
  }`}
>
  Redeem Requests
</button>

        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Messages */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {errorMessage}
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white p-6 rounded shadow hover:shadow-lg transition">
                <p className="text-gray-500 text-sm">Total Users</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {stats.totalUsers}
                </p>
              </div>
              <div className="bg-white p-6 rounded shadow hover:shadow-lg transition">
                <p className="text-gray-500 text-sm">Total Surveys</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {stats.totalSurveys || surveys.length}
                </p>
              </div>
              <div className="bg-white p-6 rounded shadow hover:shadow-lg transition">
  <p className="text-gray-500 text-sm">Total Redeem Requests</p>
  <p className="text-3xl font-bold text-red-600 mt-2">
    {redeemStats.totalRedemptions}
  </p>
  <p className="text-xs text-gray-500 mt-1">
    Pending: {redeemStats.pendingRedemptions}
  </p>
</div>

              {/* <div className="bg-white p-6 rounded shadow hover:shadow-lg transition">
                <p className="text-gray-500 text-sm">Points Distributed</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  {stats.totalPointsDistributed || 0}
                </p>
              </div> */}
            </div>

            {/* Recent Users */}
            <div className="bg-white rounded shadow p-6 mb-6">
              <h3 className="text-xl font-bold mb-4">Recent Users</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b">
                    <tr>
                      <th className="py-2 px-4">Name</th>
                      <th className="py-2 px-4">Email</th>
                      <th className="py-2 px-4">Points</th>
                      <th className="py-2 px-4">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.slice(0, 5).map((u) => (
                      <tr key={u._id} className="border-b hover:bg-gray-50 transition">
                        <td className="py-2 px-4">{u.name}</td>
                        <td className="py-2 px-4">{u.email}</td>
                        <td className="py-2 px-4">
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded">
                            {u.points || 0}
                          </span>
                        </td>
                        <td className="py-2 px-4">
                          <span
                            className={`px-3 py-1 rounded text-white text-sm ${
                              u.role === "admin"
                                ? "bg-red-500"
                                : "bg-green-500"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Surveys */}
            <div className="bg-white rounded shadow p-6">
              <h3 className="text-xl font-bold mb-4">Recent Surveys</h3>
              <div className="space-y-3">
                {surveys.slice(0, 5).map((survey) => (
                  <div
                    key={survey._id}
                    className="flex justify-between items-center p-3 border rounded hover:bg-gray-50"
                  >
                    <div>
                      <h4 className="font-semibold">{survey.title}</h4>
                      <p className="text-sm text-gray-600">{survey.surveyLink}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(survey.startDate).toLocaleDateString()} - {new Date(survey.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded">
                        {survey.rewardPoints} pts
                      </span>
                      <p className={`text-xs mt-1 px-2 py-1 rounded text-white text-center capitalize ${
                        survey.status === 'active' ? 'bg-blue-500' : survey.status === 'paused' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}>
                        {survey.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div>
            <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold mb-6">All Users</h2>
            <button  className="bg-blue-600 text-white font-semibold px-4 py-2 rounded" onClick={() => setOpenCreateUser(true)}>
          + Create User
            </button>
            </div>

        {openCreateUser && (
      <CreateUserModal
    onClose={() => setOpenCreateUser(false)}
    onSuccess={() => {
      setSuccessMessage("User created successfully");
      fetchUsers();

      setTimeout(() => {
        setSuccessMessage("");
      }, 2000);
    }}
  />
)}

           <div className="flex justify-between items-center mb-4">
  {/* Search box */}
  <input
    type="text"
    placeholder="Search by name or email"
    value={search}
    onChange={(e) => {
      setSearch(e.target.value)
      setPage(1)
    }}
    className="bg-white border px-3 py-2 rounded w-64"
  />

  {/* Page size selector */}
  <select
    value={limit}
    onChange={(e) => {
      setLimit(Number(e.target.value))
      setPage(1)
    }}
    className=" bg-white border px-3 py-2 rounded"
  >
    <option value={10}>10</option>
    <option value={25}>25</option>
    <option value={50}>50</option>
  </select>

  {/* Active/Inactive Filter */}
  <select
    value={filterActive}
    onChange={(e) => {
      setFilterActive(e.target.value === "true");
      setPage(1);
    }}
    className="bg-white border px-3 py-2 rounded"
  >
    <option value="true">Active</option>
    <option value="false">Inactive</option>
  </select>
</div>

            <div className="bg-white rounded shadow overflow-hidden">
              <div className="overflow-x-auto">
                {/* {successMessage && (
                <div className="success">
                    {successMessage}
                </div>
                )} */}

                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="py-3 px-4 text-left font-semibold">Name</th>
                      <th className="py-3 px-4 text-left font-semibold">Email</th>
                      <th className="py-3 px-4 text-left font-semibold">Phone</th>
                      <th className="py-3 px-4 text-left font-semibold">Country</th>
                      <th className="py-3 px-4 text-left font-semibold">Points</th>
                      <th className="py-3 px-4 text-left font-semibold">Role</th>
                      <th className="py-3 px-4 text-left font-semibold">Status</th>
                      <th className="p-3 px-4 text-left font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u._id} className="border-b hover:bg-gray-50 transition">
                        <td className="py-3 px-4">{u.name}</td>
                        <td className="py-3 px-4">{u.email}</td>
                        <td className="py-3 px-4">{u.phone}</td>
                        <td className="py-3 px-4">{u.country}</td>
                        <td className="py-3 px-4">
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded">
                            {u.points || 0}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-3 py-1 rounded text-white text-sm font-medium ${
                              u.role === "admin"
                                ? "bg-red-500"
                                : "bg-green-500"
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-3 py-1 rounded text-white text-sm font-medium ${
                              u.isActive ? "bg-green-500" : "bg-red-500"
                            }`}
                          >
                            {u.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="p-3 border">
  <button
    onClick={() => {
      setSelectedUser(u)
      setShowAddPointsModal(true)
    }}
    className=" rounded-2xl bg-neutral-50 border px-4 py-1 border-gray-300 text-gray-700 hover:bg-gray-100 mr-2"
  >
    Add Points
  </button>
  <button className=" rounded-2xl bg-neutral-50 border px-4 py-1 border-gray-300 text-gray-700 hover:bg-gray-100" onClick={() => setEditUser(u)}>Edit</button>
</td>

                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-between items-center mt-4">
  <button
    onClick={() => setPage(page - 1)}
    disabled={page === 1}
    className="px-4 py-2 border rounded disabled:opacity-50"
  >
    Prev
  </button>

  <span className="text-sm text-gray-600">
    Page {page} of {totalPages}
  </span>

  <button
    onClick={() => setPage(page + 1)}
    disabled={page === totalPages}
    className="px-4 py-2 border rounded disabled:opacity-50"
  >
    Next
  </button>
</div>

              </div>
              {users.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  No users found
                </div>
              )}
            </div>
          </div>
        )}

        {/* Surveys Tab */}
        {activeTab === "surveys" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">All Surveys</h2>
            <div className="flex justify-between items-center mb-4">
              {/* Search box */}
              <input
                type="text"
                placeholder="Search by title or link"
                value={surveySearch}
                onChange={(e) => {
                  setSurveySearch(e.target.value)
                  setSurveyPage(1)
                }}
                className="bg-white border px-3 py-2 rounded w-64"
              />

              {/* Page size selector */}
              <select
                value={surveyLimit}
                onChange={(e) => {
                  setSurveyLimit(Number(e.target.value))
                  setSurveyPage(1)
                }}
                className="bg-white border px-3 py-2 rounded"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="bg-white rounded shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="py-3 px-4 text-left font-semibold">Title</th>
                      <th className="py-3 px-4 text-left font-semibold">Survey Link</th>
                      <th className="py-3 px-4 text-left font-semibold">Reward Points</th>
                      <th className="py-3 px-4 text-left font-semibold">Start Date</th>
                      <th className="py-3 px-4 text-left font-semibold">End Date</th>
                      <th className="py-3 px-4 text-left font-semibold">Status</th>
                      <th className="py-3 px-4 text-left font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {surveys.map((survey) => (
                      <tr key={survey._id} className="border-b hover:bg-gray-50 transition">
                        <td className="py-3 px-4 font-semibold">{survey.title}</td>
                        <td className="py-3 px-4">
                          <a
                            href={survey.surveyLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline truncate max-w-xs"
                          >
                            {survey.surveyLink}
                          </a>
                        </td>
                        <td className="py-3 px-4">
                          <span className="bg-green-100 text-green-800 px-3 py-1 rounded">
                            {survey.rewardPoints}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">{new Date(survey.startDate).toLocaleDateString()}</td>
                        <td className="py-3 px-4 text-sm">{new Date(survey.endDate).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-3 py-1 rounded text-white text-sm font-medium text-center capitalize ${
                              survey.status === 'active'
                                ? 'bg-blue-500'
                                : survey.status === 'paused'
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                          >
                            {survey.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2 flex-wrap">
                            <button
                              onClick={() => handleViewSurvey(survey)}
                              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm font-medium transition"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleEditSurvey(survey)}
                              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium transition"
                            >
                              Edit
                            </button>
                            {survey.status === 'active' && (
                              <button
                                onClick={() => handlePauseSurvey(survey._id)}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm font-medium transition"
                              >
                                Pause
                              </button>
                            )}
                            {survey.status === 'paused' && (
                              <button
                                onClick={() => handleResumeSurvey(survey._id)}
                                className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm font-medium transition"
                              >
                                Resume
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-between items-center p-4">
                  <button
                    onClick={() => setSurveyPage(surveyPage - 1)}
                    disabled={surveyPage === 1}
                    className="px-4 py-2 border rounded disabled:opacity-50"
                  >
                    Prev
                  </button>

                  <span className="text-sm text-gray-600">
                    Page {surveyPage} of {surveyTotalPages}
                  </span>

                  <button
                    onClick={() => setSurveyPage(surveyPage + 1)}
                    disabled={surveyPage === surveyTotalPages}
                    className="px-4 py-2 border rounded disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
              {surveys.length === 0 && (
                <div className="p-6 text-center text-gray-500">
                  No surveys found
                </div>
              )}
            </div>
          </div>
        )}

        {/* Create Survey Tab */}
        {activeTab === "create" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Create New Survey</h2>
            <div className="bg-white rounded shadow p-6 max-w-2xl">
              <form onSubmit={handleCreateSurvey} className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Survey Title
                  </label>
                  <input
                    type="text"
                    value={newSurvey.title}
                    onChange={(e) =>
                      setNewSurvey({ ...newSurvey, title: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    placeholder="Enter survey title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Survey Link
                  </label>
                  <input
                    type="url"
                    value={newSurvey.surveyLink}
                    onChange={(e) =>
                      setNewSurvey({ ...newSurvey, surveyLink: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    placeholder="https://example.com/survey"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Reward Points
                  </label>
                  <input
                    type="number"
                    value={newSurvey.rewardPoints}
                    onChange={(e) =>
                      setNewSurvey({ ...newSurvey, rewardPoints: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    placeholder="100"
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Start Date
                  </label>
                  <input
                    type="datetime-local"
                    value={newSurvey.startDate}
                    onChange={(e) =>
                      setNewSurvey({ ...newSurvey, startDate: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    End Date
                  </label>
                  <input
                    type="datetime-local"
                    value={newSurvey.endDate}
                    onChange={(e) =>
                      setNewSurvey({ ...newSurvey, endDate: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition"
                >
                  Create Survey
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Assign Survey Tab */}
        {activeTab === "assign" && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Assign Survey to Users</h2>
            <div className="bg-white rounded shadow p-6 max-w-2xl">
              <form onSubmit={handleAssignSurvey} className="space-y-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Select Users (Multiple)
                  </label>
                  <select
                    multiple
                    value={assignSurvey.userIds}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value)
                      setAssignSurvey({ ...assignSurvey, userIds: selected })
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 min-h-32"
                    required
                  >
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.email})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-2">Hold Ctrl (or Cmd) to select multiple users</p>
                  {assignSurvey.userIds.length > 0 && (
                    <p className="text-sm text-green-600 mt-2">{assignSurvey.userIds.length} user(s) selected</p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Select Survey
                  </label>
                  <select
                    value={assignSurvey.surveyId}
                    onChange={(e) =>
                      setAssignSurvey({ ...assignSurvey, surveyId: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    required
                  >
                    <option value="">Choose a survey...</option>
                    {surveys.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.title} ({s.rewardPoints} pts)
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700 transition"
                >
                  Assign Survey
                </button>
              </form>
            </div>
          </div>
        )}

       {activeTab === "redeem" && (
  <div>
    <h2 className="text-2xl font-bold mb-6">Redeem Requests</h2>

    <div className="flex justify-between items-center mb-4">
      <input
        type="text"
        value={redeemSearch}
        onChange={(e) => {
          setRedeemSearch(e.target.value);
          setRedeemPage(1);
        }}
        placeholder="Search by user name or email"
        className="bg-white border px-3 py-2 rounded w-64"
      />

      <select
        value={redeemLimit}
        onChange={(e) => {
          setRedeemLimit(Number(e.target.value));
          setRedeemPage(1);
        }}
        className="bg-white border px-3 py-2 rounded"
      >
        <option value={10}>10</option>
        <option value={25}>25</option>
        <option value={50}>50</option>
      </select>
    </div>

    <div className="bg-white rounded shadow overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="py-3 px-4 text-left">User</th>
            <th className="py-3 px-4 text-left">Email</th>
            <th className="py-3 px-4 text-left">Redeem Points</th>
            <th className="py-3 px-4 text-left">After Redeem Points</th>
            <th className="py-3 px-4 text-left">Status</th>
            <th className="py-3 px-4 text-left">Action</th>
          </tr>
        </thead>

        <tbody>
          {redemptionRequests.length === 0 ? (
            <tr>
              <td
                colSpan="6"
                className="text-center py-6 text-gray-500"
              >
                No redemption requests found
              </td>
            </tr>
          ) : (
            redemptionRequests.map((r) => (
              <tr key={r._id} className="border-b hover:bg-gray-50">
                <td className="py-3 px-4">{r.userId?.name}</td>
                <td className="py-3 px-4">{r.userId?.email}</td>
                <td className="py-3 px-4">
                  <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded">
                    {r.points}
                  </span>
                </td>
                <td className="py-3 px-4">{r.userId?.points}</td>
                <td className="py-3 px-4 capitalize">{r.status}</td>
                <td className="py-3 px-4 flex gap-2">
                  {r.status === "pending" && (
                    <>
                      <button
                        onClick={() => approveRedeem(r._id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => rejectRedeem(r._id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <div className="flex justify-between items-center p-4">
        <button
          onClick={() => setRedeemPage(redeemPage - 1)}
          disabled={redeemPage === 1}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Prev
        </button>

        <span className="text-sm text-gray-600">
          Page {redeemPage} of {redeemTotalPages}
        </span>

        <button
          onClick={() => setRedeemPage(redeemPage + 1)}
          disabled={redeemPage === redeemTotalPages}
          className="px-4 py-2 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  </div>
)}


      </div>

      {/* View Survey Details Modal */}
      {showDetailModal && selectedSurvey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">{selectedSurvey.title}</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <p className="text-gray-600 text-sm">Survey Link</p>
                <a
                  href={selectedSurvey.surveyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline break-all"
                >
                  {selectedSurvey.surveyLink}
                </a>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 text-sm">Reward Points</p>
                  <p className="font-semibold text-lg">{selectedSurvey.rewardPoints}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Status</p>
                  <span
                    className={`inline-block px-3 py-1 rounded text-white text-sm font-medium ${
                      selectedSurvey.status === 'active'
                        ? 'bg-blue-500'
                        : selectedSurvey.status === 'paused'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}
                  >
                    {selectedSurvey.status}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600 text-sm">Start Date</p>
                  <p className="font-semibold">{new Date(selectedSurvey.startDate).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">End Date</p>
                  <p className="font-semibold">{new Date(selectedSurvey.endDate).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-xl font-bold mb-4">Assigned Users ({assignedUsers.length})</h3>
              {assignedUsers.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No users assigned to this survey</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="py-2 px-3 text-left">Name</th>
                        <th className="py-2 px-3 text-left">Email</th>
                        <th className="py-2 px-3 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignedUsers.map((u) => (
                        <tr key={u._id} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-3">{u.name}</td>
                          <td className="py-2 px-3">{u.email}</td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium text-white ${
                                u.assignmentStatus === 'rewarded'
                                  ? 'bg-green-500'
                                  : 'bg-blue-500'
                              }`}
                            >
                              {u.assignmentStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Survey Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Edit Survey</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitEdit} className="space-y-6">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Survey Title
                </label>
                <input
                  type="text"
                  value={editSurvey.title}
                  onChange={(e) =>
                    setEditSurvey({ ...editSurvey, title: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Survey Link
                </label>
                <input
                  type="url"
                  value={editSurvey.surveyLink}
                  onChange={(e) =>
                    setEditSurvey({ ...editSurvey, surveyLink: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Reward Points
                </label>
                <input
                  type="number"
                  value={editSurvey.rewardPoints}
                  onChange={(e) =>
                    setEditSurvey({ ...editSurvey, rewardPoints: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                  placeholder="100"
                  min="1"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={editSurvey.startDate}
                    onChange={(e) =>
                      setEditSurvey({ ...editSurvey, startDate: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={editSurvey.endDate}
                    onChange={(e) =>
                      setEditSurvey({ ...editSurvey, endDate: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-2 bg-gray-300 hover:bg-gray-400 rounded font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Points Modal */}
      {showAddPointsModal && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded shadow p-6 w-96">
      <h3 className="text-lg font-bold mb-4">
        Add Points to {selectedUser?.name}
      </h3>

      <input
        type="number"
        placeholder="Enter points"
        value={pointsToAdd}
        onChange={(e) => setPointsToAdd(e.target.value)}
        className="w-full border px-3 py-2 rounded mb-4"
      />

      <div className="flex justify-end gap-2">
        <button
          onClick={() => {
            setShowAddPointsModal(false)
            setPointsToAdd("")
          }}
          className="px-4 py-2 border rounded"
        >
          Cancel
        </button>

        <button onClick={handleAddPoints}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Add
        </button>
      </div>
    </div>

    
  </div>
      )}

      {/*edit User Modal */}
      {editUser && (
      <EditUserModal
       user={editUser}
     onClose={() => setEditUser(null)}
      onSuccess={fetchUsers}/>
      )}

    </div>
  )
}

export default AdminDashboard
