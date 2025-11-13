import { useWeather } from "../../hooks/useWeather";

export default function WeatherPanel() {
  const { data, loading, error } = useWeather();

  return (
    <div className="w-full h-full bg-gray-800 rounded-xl shadow-xl overflow-hidden">
      <div className="px-4 py-2 border-b border-white/10 font-semibold">Weather Safety</div>
      <div className="p-3">
        {loading && <div className="text-white/40 text-sm">Loading...</div>}
        {error && <div className="text-red-400 text-sm">{error}</div>}
        {data && (
          <div className="space-y-1 text-sm">
            <div>Temp: {data.temp}°C</div>
            <div>Wind: {data.wind} km/h</div>
            <div>Condition: {data.description}</div>
            <div className={data.safe ? "text-green-400 font-medium" : "text-red-400 font-medium"}>
              {data.safe ? "Safe to work" : "Unsafe conditions"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
