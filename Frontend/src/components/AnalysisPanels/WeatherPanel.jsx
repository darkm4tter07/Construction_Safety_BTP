import { useWeather } from "../../hooks/useWeather";
import { useEffect } from "react";

export default function WeatherPanel() {
  const { data, loading, error } = useWeather();

  useEffect(() => {
    if (data) window.__weatherData = data;
  }, [data]);

  return (
    <div className="w-[320px] lg:w-[350px] bg-zinc-800 rounded-xl border border-zinc-700 overflow-hidden flex flex-col">

      {/* Header */}
      <div className="px-4 py-2.5 border-b border-zinc-700 bg-zinc-700/30 flex justify-between items-center">
        <span className="text-xs font-semibold tracking-widest text-zinc-300 uppercase">
          Weather Safety
        </span>
        {data && (
          <span className={`text-[10px] font-semibold tracking-wide ${data.safe ? "text-green-400" : "text-red-400"}`}>
            {data.safe ? "safe to work" : "unsafe conditions"}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-3">
        {loading && (
          <p className="text-[11px] text-zinc-400">Loading...</p>
        )}

        {error && (
          <p className="text-[11px] text-red-400/60">{error}</p>
        )}

        {data && (
          <div className="space-y-3">
            {/* Row 1: Temp | Wind | Condition */}
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-white tabular-nums">{data.temp}°</div>
                <div className="text-[10px] text-zinc-400 uppercase tracking-wide">Temp</div>
              </div>

              <div className="w-px h-8 bg-zinc-600" />

              <div className="text-center">
                <div className="text-lg font-bold text-white tabular-nums">{data.wind}</div>
                <div className="text-[10px] text-zinc-400 uppercase tracking-wide">km/h</div>
              </div>

              <div className="w-px h-8 bg-zinc-600" />

              <div className="flex-1">
                <div className="text-xs text-zinc-300 capitalize">{data.description}</div>
                <div className="text-[10px] text-zinc-400 mt-0.5">conditions</div>
              </div>

              <span className={`w-2 h-2 rounded-full shrink-0 ${data.safe ? "bg-green-500" : "bg-red-500"}`} />
            </div>

            {/* Divider */}
            <div className="h-px bg-zinc-700" />

            {/* Row 2: Humidity | Visibility */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 flex-1">
                <svg className="w-3 h-3 text-zinc-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1M4.22 4.22l.71.71m12.02 12.02l.71.71M1 12h1m20 0h1M4.22 19.78l.71-.71M18.95 5.05l-.71.71" />
                </svg>
                <div>
                  <div className="text-xs font-semibold text-zinc-200 tabular-nums">
                    {data.humidity ?? '—'}
                    <span className="text-zinc-400 font-normal text-[10px]">%</span>
                  </div>
                  <div className="text-[10px] text-zinc-400">Humidity</div>
                </div>
              </div>

              <div className="w-px h-6 bg-zinc-700" />

              <div className="flex items-center gap-2 flex-1">
                <svg className="w-3 h-3 text-zinc-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <div>
                  <div className="text-xs font-semibold text-zinc-200 tabular-nums">
                    {data.visibility ?? '—'}
                    <span className="text-zinc-400 font-normal text-[10px]"> km</span>
                  </div>
                  <div className="text-[10px] text-zinc-400">Visibility</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}