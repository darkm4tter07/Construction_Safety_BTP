import Header from "../components/Header";
import VideoFeed from "../components/VideoFeeds/VideoFeed";
import PPEPanel from "../components/AnalysisPanels/PPEPanel";
import RulaRebaPanel from "../components/AnalysisPanels/RulaRebaPanel";
import WeatherPanel from "../components/AnalysisPanels/WeatherPanel";
import Controls from "../components/Controls";
import FitnessPanel from "../components/AnalysisPanels/FitnessPanel";
import AlertPanel from "../components/AnalysisPanels/AlertPanel";
import { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useWebSocket } from "../hooks/useWebSocket";  
import { useWeather } from "../hooks/useWeather";     

export default function Dashboard() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { lastResult } = useWebSocket();
  const weatherData = useWeather();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      login(token);
      navigate('/admin/dashboard', { replace: true });
    }
  }, [searchParams, login, navigate]);

  return (
    <div className="w-screen h-screen flex flex-col bg-black text-white overflow-y-auto">

      {/* Header */}
      <div className="h-[8vh] shrink-0">
        <Header />
      </div>

      {/* Main Content - CSS Grid */}
      <div className="flex-1 px-4 pb-2 pt-3 overflow-hidden min-h-0">
        <div className="grid grid-cols-[30fr_20fr_25fr_25fr] gap-3 h-full">

          {/* Column 1: Video Feeds - 30fr */}
          <div className="flex flex-col gap-3 min-h-0">
            <div className="flex-1 min-h-0">
              <VideoFeed title="Object Detection" channel="object" />
            </div>
            <div className="flex-1 min-h-0">
              <VideoFeed title="Pose Detection" channel="pose" />
            </div>
          </div>

          {/* Column 2: PPE + Ergonomic - 20fr */}
          <div className="flex flex-col gap-3 min-h-0">
            <div className="flex-1 min-h-0">
              <PPEPanel />
            </div>
            <div className="flex-1 min-h-0">
              <RulaRebaPanel />
            </div>
          </div>

          {/* Column 3: Fitness + Weather - 25fr */}
          <div className="flex flex-col gap-3 min-h-0">
            <div className="flex-1 min-h-0">
              <FitnessPanel />
            </div>
            <div className="shrink-0">
              <WeatherPanel />
            </div>
          </div>

          {/* Column 4: Alert Panel - 25fr */}
          <div className="flex flex-col gap-3 min-h-0">
            {/* PASS PROPS HERE */}
            <AlertPanel 
              lastResult={lastResult}
              weather={weatherData.data}
            />
          </div>

        </div>
      </div>

      {/* Controls */}
      <div className="h-[8vh] shrink-0">
        <Controls />
      </div>
    </div>
  );
}