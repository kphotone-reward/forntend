import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../api/axios"

function UserDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [surveys, setSurveys] = useState([])
  const [errorMessage, setErrorMessage] = useState("")
  const [redeemPoints, setRedeemPoints] = useState("")
  const [userPoints, setUserPoints] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/auth/profile")
        setUser(res.data.user)
      } catch (err) {
        console.error("Profile fetch failed", err)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  // Fetch assigned surveys
  useEffect(() => {
    const fetchAssignedSurveys = async () => {
      try {
        const res = await api.get("/survey/assigned")
        setSurveys(res.data.surveys || [])
      } catch (err) {
        console.error("Failed to fetch surveys", err)
        setErrorMessage("Failed to fetch assigned surveys")
      }
    }

    if (user) {
      fetchAssignedSurveys()
    }
  }, [user])

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("token")
    navigate("/login")
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  /*request to redeem points*/
  const handleRedeem = async () => {
  if (userPoints < 50) {
    alert("You need at least 50 points")
    return
  }

  if (Number(redeemPoints) < 50) {
    alert("Minimum redeem amount is 50")
    return
  }

  try {
    const res = await api.post("/redeem/request", {
      points: Number(redeemPoints)
    })

    alert(res.data.message)

    // refresh user points after request
    fetchProfile()
  } catch (err) {
    alert(err.response?.data?.message || "Redeem failed")
  }
}


  return (
    <div className="min-h-screen bg-white p-6">
     
      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold"><img src="https://raw.githubusercontent.com/kphotone-research/Images-kphotone/main/Logo.png" alt="Logo" style={{width:250}} /></h1>
        <div className="flex justify-between items-center">
        <span className="text-gray-600 mr-4 font-semibold"> Welcome {user?.email}</span>
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded font-semibold transition"
        >
          Logout
        </button>
        </div>
      </div>
      <div className="mb-6">
        <h1 className="text-3xl">Welcome! </h1>
        <h2 className="text-1xl text-gray-600 mt-2">our rewards and recent surveys are ready to review.</h2>
     </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-500">Email</p>
          <p className="font-semibold">{user?.email}</p>
        </div> */}

        {/* <div className="bg-white p-4 rounded shadow">
          <p className="text-gray-500">Role</p>
          <p className="font-semibold">{user?.role}</p>
        </div> */}

        <div className="bg-blue-500 p-4 rounded shadow text-center">
          <p className="text-white font-normal text-2xl">Reward Points</p>
          <p className="font-semibold text-[48px] text-white">
            {user?.points ?? 0}
          </p>
         
        </div>

        <div className="bg-orange-100 p-4 rounded text-center border border-amber-300">
  <h3 className="mb-2">Redeem Points</h3>

  <input
    type="number"
    placeholder="Enter points (min 50)"
    value={redeemPoints}
    onChange={(e) => setRedeemPoints(e.target.value)}
    className="p-2 bg-white rounded border border-gray-300 w-1/2 text-center"
  />

  <br />
<p className="mb-2 text-sm text-gray-600">
  Available Points: <b>{user?.points ?? 0}</b>
</p>
  <button
  onClick={handleRedeem}
  disabled={user?.Points < 50}
  className={`mt-3 p-2 px-4 rounded text-white ${
    user?.Points < 50 ? "bg-gray-400" : "bg-blue-600"
  }`}
>
  Redeem Points
</button>
{userPoints < 50 && (
  <p className="text-red-500 text-sm mt-2">
    Minimum 50 points required to redeem
  </p>
)}
</div>

    </div>

    {/* Recent Surveys */}
            <div className="bg-blue-50 rounded  p-6 mt-5">
              <h3 className="text-xl font-bold ">Recent Activity</h3>
              <h4 className="text-[14px] text-gray-600 mb-4">Recent survey to your account are shown below</h4>
              <div className="space-y-3 flex flex-row gap-5 flex-wrap">
                {surveys.slice(0, 3).map((survey) => (
                  <div
                    key={survey._id}
                    className="flex justify-between items-center p-3  bg-white rounded shadow hover:bg-gray-50 width-[200px] ">
                    <div className="flex flex-row gap-5 align-top">
                      <div className="width-[40%]">
                      <h4 className="font-semibold">{survey.title}</h4>
                      <a href={survey.surveyLink} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">{survey.surveyLink}</a>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(survey.startDate).toLocaleDateString()} - {new Date(survey.endDate).toLocaleDateString()}
                      </p>
                      </div>
                      <div className="text-right">
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded">
                        {survey.rewardPoints} pts
                      </span>
                      <p className={`text-xs mt-1 px-2 py-1 rounded text-white text-center capitalize  ${
                        survey.status === 'active' ? 'bg-blue-500' : survey.status === 'paused' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}>
                        {survey.status}
                      </p>
                    </div>
                    </div>
                    
                  </div>
                ))}
              </div>
            </div>
    </div>
  )
}

export default UserDashboard
