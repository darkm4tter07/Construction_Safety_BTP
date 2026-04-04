import { useState, useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { getTimeSince, getSeverityColors, getIcon } from '../../utils/alertUtils';
import { getPPEViolations } from '../../utils/detectionUtils';

export default function AlertPanel({ lastResult, weather, fitness }) {
  const [alerts, setAlerts] = useState([]);

  // Monitor for PPE violations
  useEffect(() => {
    if (!lastResult?.detections) return;

    const violations = getPPEViolations(lastResult.detections);

    violations.forEach(violation => {
      const typeMap = {
        hardhat: 'Hardhat',
        mask: 'Mask',
        vest: 'Safety Vest',
      };

      addAlert({
        type: 'ppe_violation',
        severity: 'high',
        icon: 'warning',
        title: `PPE Violation - ${typeMap[violation.type]}`,
        message: violation.message,
      });
    });

    // Ergonomic Alerts
    if (lastResult.posture?.rula?.score >= 5) {
      const rula = lastResult.posture.rula;
      addAlert({
        type: 'ergonomic',
        severity: rula.score >= 6 ? 'high' : 'medium',
        icon: 'warning',
        title: rula.score >= 6 ? 'High Ergonomic Risk' : 'Moderate Ergonomic Risk',
        message: `RULA: ${rula.score} (${rula.risk})`,
      });
    }

    if (lastResult.posture?.reba?.score >= 8) {
      const reba = lastResult.posture.reba;
      addAlert({
        type: 'ergonomic',
        severity: reba.score >= 11 ? 'high' : 'medium',
        icon: 'warning',
        title: reba.score >= 11 ? 'Very High Ergonomic Risk' : 'Elevated Ergonomic Risk',
        message: `REBA: ${reba.score} (${reba.risk})`,
      });
    }
  }, [lastResult]);

  // Monitor fitness data
  useEffect(() => {
    if (!fitness?.workers) return;

    fitness.workers.forEach(worker => {
      if (worker.heart_rate > 140) {
        addAlert({
          type: 'physiological',
          severity: 'high',
          icon: 'warning',
          title: 'Elevated Heart Rate',
          message: `${worker.full_name}: ${worker.heart_rate} bpm (abnormal)`,
        });
      }

      if (worker.steps < 100 && Date.now() > (worker.session_start || 0) + 3600000) {
        addAlert({
          type: 'physiological',
          severity: 'medium',
          icon: 'warning',
          title: 'Low Activity Detected',
          message: `${worker.full_name}: ${worker.steps} steps (fatigue risk)`,
        });
      }
    });
  }, [fitness]);

  // Monitor weather
  useEffect(() => {
    if (!weather || weather.safe) return;

    if (weather.temp >= 38) {
      addAlert({
        type: 'environmental',
        severity: 'high',
        icon: 'warning',
        title: 'Unsafe Weather - Heat',
        message: `Temperature: ${weather.temp}°C (Heat stroke risk)`,
      });
    }

    if (weather.wind >= 35) {
      addAlert({
        type: 'environmental',
        severity: 'high',
        icon: 'warning',
        title: 'High Wind Speed',
        message: `Wind: ${weather.wind} km/h (Falling object risk)`,
      });
    }

    if (weather.visibility <= 1) {
      addAlert({
        type: 'environmental',
        severity: 'high',
        icon: 'warning',
        title: 'Poor Visibility',
        message: `Visibility: ${weather.visibility} km (Collision risk)`,
      });
    }
  }, [weather]);

  function addAlert(alert) {
    const newAlert = {
      ...alert,
      id: Date.now() + Math.random(),
      timestamp: new Date(),
    };

    setAlerts(prev => {
      const isDuplicate = prev.some(
        a => a.title === alert.title && 
        Date.now() - new Date(a.timestamp).getTime() < 10000
      );
      
      if (isDuplicate) return prev;
      
      const updated = [newAlert, ...prev].slice(0, 10);
      window.__alertsData = updated; // add this line
      return updated;
    });
  }

  return (
    <div className="w-full h-full bg-zinc-800 rounded-xl border border-zinc-700 overflow-hidden flex flex-col">
      
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-zinc-700 bg-zinc-700/30 flex justify-between items-center shrink-0">
        <span className="text-xs font-semibold tracking-widest text-zinc-300 uppercase">
          Safety Alerts
        </span>
        {alerts.length > 0 && (
          <button
            onClick={() => setAlerts([])}
            className="text-[10px] text-zinc-400 hover:text-white transition flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            clear
          </button>
        )}
      </div>

      {/* Alert List */}
      <div className="flex-1 overflow-y-auto p-2 min-h-0">
        {alerts.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <CheckCircle className="w-8 h-8 text-green-500/50 mx-auto mb-2" />
              <p className="text-xs text-zinc-300">No active alerts</p>
              <p className="text-[10px] text-zinc-400 mt-1">System monitoring normally</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map(alert => {
              const colors = getSeverityColors(alert.severity);
              const Icon = getIcon(alert.icon);
              
              return (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border-l-2 ${colors.border} ${colors.bg} hover:bg-zinc-700/50 transition`}
                >
                  <div className="flex items-start gap-2">
                    <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${colors.icon}`} />
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-semibold ${colors.text}`}>
                        {alert.title}
                      </div>
                      <div className="text-[11px] text-zinc-300 mt-1">
                        {alert.message}
                      </div>
                      <div className="text-[10px] text-zinc-400 mt-2">
                        {getTimeSince(alert.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-zinc-700 shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-zinc-400">
            {alerts.length} active alert{alerts.length !== 1 ? 's' : ''}
          </span>
          {alerts.length > 0 && (
            <span className="text-[10px] text-zinc-400">
              Last: {getTimeSince(alerts[0].timestamp)}
            </span>
          )}
        </div>
      </div>

    </div>
  );
}