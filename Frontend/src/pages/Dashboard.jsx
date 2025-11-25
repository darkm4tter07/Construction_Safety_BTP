import Header from "../components/Header";
// import StatusBar from "../components/StatusBar";
import VideoFeed from "../components/VideoFeeds/VideoFeed";
import PPEPanel from "../components/AnalysisPanels/PPEPanel";
import RulaRebaPanel from "../components/AnalysisPanels/RulaRebaPanel";
import WeatherPanel from "../components/AnalysisPanels/WeatherPanel";
import RiskLegend from "../components/AnalysisPanels/RiskLegend";
import Controls from "../components/Controls";

export default function Dashboard() {
  return (
    <div className="w-screen h-screen flex flex-col bg-gray-900 text-white">
      {/* Header (8vh) */}
      <div className="h-[8vh] shrink-0">
        <Header />
      </div>

      {/* Main grid (84vh) */}
      <div className="h-[84vh] flex px-6 pb-2">
        {/* Left: two feeds stacked (65% width) */}
        <div className="w-[60%] h-full flex flex-col gap-2 pr-3">
          <div className="flex-1 min-h-0">
            <VideoFeed title="Object Detection" channel="object" />
          </div>
          <div className="flex-1 min-h-0">
            <VideoFeed title="Pose Detection" channel="pose" />
          </div>
        </div>

        {/* Right: analysis panels (35% width) */}
        <div className="w-[40%] h-full flex flex-col gap-2">
          <div className="flex flex-1 gap-2">
            <div className="w-1/2 min-h-0">
              <PPEPanel />
            </div>
            <div className="flex flex-1 flex-col gap-2 min-h-0">
              <RulaRebaPanel />
              <WeatherPanel />
            </div>
          </div>
          
          <div className="flex-none">
            <RiskLegend />
          </div>
        </div>
      </div>

      {/* Controls (8vh) */}
      <div className="h-[8vh] shrink-0">
        <Controls />
      </div>
    </div>
  );
}
