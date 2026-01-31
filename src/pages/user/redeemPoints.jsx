import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

function RedeemPoints() {
  const navigate = useNavigate();

  const [redemptionRequests, setRedemptionRequests] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  const [filterStatus, setFilterStatus] = useState("Approved");

  // Fetch redemption requests
  useEffect(() => {
    const fetchRedemptionRequests = async () => {
      try {
        const res = await api.get("/redemption/requests");
        setRedemptionRequests(res.data.requests || []);
      } catch (err) {
        console.error("Failed to fetch redemption requests", err);
        setErrorMessage("Failed to fetch redemption requests");
      }
    };

    fetchRedemptionRequests();
  }, []);

  const filteredRequests =
    filterStatus === "All"
      ? redemptionRequests
      : redemptionRequests.filter((request) =>
        request.status.toLowerCase() === filterStatus.toLowerCase()
      );

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header at the top */}
      <header className="bg-white px-6 py-2 border-b border-gray-300 fixed top-0 left-0 w-full z-10">
        <div className="flex justify-between items-center">
          <img
            src="https://raw.githubusercontent.com/kphotone-research/Images-kphotone/main/Logo.png"
            alt="Logo"
            style={{ width: 150, height: 50 }}
          />
          <button
            onClick={() => navigate("/user/dashboard")}
            className="bg-blue-500 hover:bg-blue-400 text-white px-4 py-2 rounded"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 mt-16 p-6">
        <main className="flex-1">
         
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Your Redemption Requests</h2>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="p-2 border border-gray-300 rounded"
            >
              <option value="All">All</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
              <option value="Approved">Approved</option>
            </select>
          </div>

          <table className="table-auto w-full border-collapse border border-gray-300">
            <thead>
              <tr>
                <th className="border border-gray-300 px-4 py-2">Date</th>
                <th className="border border-gray-300 px-4 py-2">Points</th>
                <th className="border border-gray-300 px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request) => (
                <tr key={request._id}>
                  <td className="border border-gray-300 px-4 py-2">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">{request.points}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    <span
                      className={`capitalize rounded-2xl px-2 py-1 ${
                        request.status.toLowerCase() === "pending"
                          ? "text-orange-800 bg-orange-100"
                          : request.status.toLowerCase() === "approved"
                          ? "text-green-800 bg-green-100"
                          : request.status.toLowerCase() === "rejected"
                          ? "text-red-800 bg-red-100"
                          : ""
                      }`}
                    >
                      {request.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredRequests.length === 0 && (
            <p className="text-gray-500 mt-4">
              No redemption requests found for {filterStatus.toLowerCase()} status.
            </p>
          )}

          {errorMessage && (
            <p className="text-red-500 mt-4">{errorMessage}</p>
          )}
        </main>
      </div>
    </div>
  );
}

export default RedeemPoints;