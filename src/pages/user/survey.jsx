import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

function SurveyPage() {
  const navigate = useNavigate();
  const [surveys, setSurveys] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  // Fetch surveys assigned to the user
  useEffect(() => {
    const fetchSurveys = async () => {
      try {
        const res = await api.get("/surveys/assigned", {
          params: { userId: user?._id },
        });
        setSurveys(res.data.surveys || []);
      } catch (err) {
        console.error("Failed to fetch surveys", err);
        setErrorMessage("Failed to fetch surveys");
      }
    };

    fetchSurveys();
  }, []);

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
            className="bg-gray-200 hover:bg-gray-300 text-gray-400 px-4 py-2 rounded"
          >
            Back to Dashboard
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 mt-16 p-6">
        <main className="flex-1">
          <h2 className="text-xl font-semibold mb-4">Assigned Surveys</h2>

          {surveys.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {surveys.map((survey) => (
                <div
                  key={survey._id}
                  className="bg-white p-4 rounded shadow border border-gray-300"
                >
                  <h3 className="font-semibold text-lg mb-2">{survey.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{survey.description}</p>
                  <a
                    href={survey.surveyLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Open Survey
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No surveys assigned to you.</p>
          )}

          {errorMessage && (
            <p className="text-red-500 mt-4">{errorMessage}</p>
          )}
        </main>
      </div>
    </div>
  );
}

export default SurveyPage;