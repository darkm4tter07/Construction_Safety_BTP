import { useEffect, useState, useRef } from "react";

const API_KEY = "52bdd4995651cd9aacfcd215abb41252";

export function useWeather() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const intervalRef = useRef(null);

  useEffect(() => {
    const fetchWeather = async (lat, lon) => {
      try {
        setLoading(true);
        const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
        const res = await fetch(url);
        const w = await res.json();

        if (!w || !w.list || !w.list.length) {
          throw new Error("Invalid response structure");
        }

        const latest = w.list[0];
        const temp = latest.main.temp;
        const wind = latest.wind.speed;
        const description = latest.weather[0].description;
        const humidity = latest.main.humidity;                          // % (0-100)
        const visibility = Math.round((latest.visibility ?? 10000) / 1000); // meters → km

        // Safety rules
        const unsafeHeat = temp >= 38;
        const unsafeCold = temp <= 4;
        const unsafeWind = wind >= 35;
        const unsafeDesc = /thunder|storm|dust|rain|hail/i.test(description || "");
        const unsafeHumidity = humidity >= 90;                          // very high humidity
        const unsafeVisibility = visibility <= 1;                       // less than 1km visibility

        setData({
          city: w.city.name,
          temp,
          wind,
          description,
          humidity,
          visibility,
          safe: !(unsafeHeat || unsafeCold || unsafeWind || unsafeDesc || unsafeHumidity || unsafeVisibility),
          timestamp: latest.dt_txt
        });
        setError("");
      } catch (e) {
        console.error("Weather fetch failed:", e);
        setError("Weather fetch failed");
      } finally {
        setLoading(false);
      }
    };

    const getLocationAndFetch = () => {
      if (!navigator.geolocation) {
        setError("Geolocation not available");
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const { latitude, longitude } = coords;
          fetchWeather(latitude, longitude);

          if (!intervalRef.current) {
            intervalRef.current = setInterval(() => {
              fetchWeather(latitude, longitude);
            }, 15 * 60 * 1000);
          }
        },
        (err) => {
          console.error("Location error:", err);
          setError("Location denied or unavailable");
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    };

    getLocationAndFetch();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { data, loading, error };
}