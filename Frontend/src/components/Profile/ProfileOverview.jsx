import { useNavigate } from "react-router-dom";
import { Brain, Activity, Phone, AlertTriangle, CheckCircle, Clock, ChevronRight, Shield, User } from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import { AUTH_URL as API_URL } from "../../Constant";

function InfoRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start justify-between gap-4 py-2 border-b border-zinc-700/50 last:border-0">
      <span className="text-[11px] text-zinc-500 uppercase tracking-wider shrink-0">{label}</span>
      <span className="text-xs text-zinc-300 text-right">{value}</span>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children, action }) {
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">{title}</span>
        </div>
        {action}
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

export default function ProfileOverview({
  workerProfile,
  workerData,
  isAdminView,
  userId,
}) {
  const navigate = useNavigate();
  const [latestCognitive, setLatestCognitive] = useState(null);
  const [cognitiveLoading, setCognitiveLoading] = useState(true);

  const targetId = isAdminView ? userId : null;
  const base = isAdminView ? `/admin/worker/${userId}` : "/worker/profile";

  const { fitnessData, getBMI, getBMICategory } = workerData;
  const bmi = getBMI();
  const bmiCategory = getBMICategory(bmi);

  // Fetch latest cognitive assessment
  useEffect(() => {
    const fetchCognitive = async () => {
      try {
        const url = isAdminView
          ? `${API_URL}/profile/${userId}/cognitive/latest`
          : `${API_URL}/profile/${workerData?.profileUser?.id}/cognitive/latest`;
        if (!userId && !workerData?.profileUser?.id) return;
        const res = await axios.get(url);
        setLatestCognitive(res.data.assessment);
      } catch (err) {
        console.error("Failed to fetch cognitive assessment:", err);
      } finally {
        setCognitiveLoading(false);
      }
    };
    fetchCognitive();
  }, [userId, isAdminView]);

  // Cognitive status
  const getCognitiveStatus = () => {
    if (cognitiveLoading) return null;
    if (!latestCognitive) return {
      label: "Not Taken",
      sub: "Cognitive test required",
      color: "text-red-400",
      bg: "bg-red-500/10 border-red-500/20",
      icon: AlertTriangle,
    };
    const isValid = new Date(latestCognitive.valid_until) > new Date();
    if (!isValid) return {
      label: "Expired",
      sub: "Retake required",
      color: "text-yellow-400",
      bg: "bg-yellow-500/10 border-yellow-500/20",
      icon: Clock,
    };
    const config = {
      FIT: { label: "Fit", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20", icon: CheckCircle },
      SUPERVISION_REQUIRED: { label: "Supervision Required", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20", icon: AlertTriangle },
      UNFIT: { label: "Unfit", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", icon: AlertTriangle },
    };
    return {
      ...config[latestCognitive.result],
      sub: `Score: ${latestCognitive.score}/100 · Valid until ${new Date(latestCognitive.valid_until).toLocaleDateString()}`,
    };
  };

  const cognitiveStatus = getCognitiveStatus();

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null;

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-4 pb-8">

      {/* Cognitive Test Status */}
      {cognitiveStatus && (
        <button
          onClick={() => navigate(`${base}/cognitive`)}
          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition hover:opacity-90 ${cognitiveStatus.bg}`}
        >
          <div className="flex items-center gap-3">
            <cognitiveStatus.icon className={`w-4 h-4 ${cognitiveStatus.color}`} />
            <div className="text-left">
              <p className={`text-xs font-semibold ${cognitiveStatus.color}`}>
                Cognitive Test — {cognitiveStatus.label}
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">{cognitiveStatus.sub}</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
        </button>
      )}

      {/* Fitness Quick Summary */}
      {fitnessData && (
        <SectionCard
          title="Fitness Today"
          icon={Activity}
          action={
            <button
              onClick={() => navigate(`${base}/fitness`)}
              className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              View all <ChevronRight className="w-3 h-3" />
            </button>
          }
        >
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Steps", value: fitnessData.steps?.toLocaleString() || "0" },
              { label: "Heart Rate", value: fitnessData.heart_rate ? `${fitnessData.heart_rate} bpm` : "—" },
              { label: "Calories", value: fitnessData.calories ? `${fitnessData.calories} kcal` : "—" },
            ].map(item => (
              <div key={item.label} className="bg-zinc-700/40 rounded-lg px-3 py-2.5 text-center">
                <p className="text-sm font-semibold text-zinc-100">{item.value}</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">{item.label}</p>
              </div>
            ))}
          </div>
          {bmi && (
            <div className="mt-3 flex items-center justify-between px-3 py-2 bg-zinc-700/40 rounded-lg">
              <span className="text-[11px] text-zinc-400">BMI</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-200">{bmi}</span>
                {bmiCategory && (
                  <span className={`text-[10px] font-medium ${bmiCategory.color}`}>
                    {bmiCategory.label}
                  </span>
                )}
              </div>
            </div>
          )}
        </SectionCard>
      )}

      {/* Work Details */}
      {workerProfile && (
        <SectionCard
          title="Work Details"
          icon={Shield}
          action={
            <button
              onClick={() => navigate(`${base}/edit`)}
              className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1"
            >
              Edit <ChevronRight className="w-3 h-3" />
            </button>
          }
        >
          <InfoRow label="Designation" value={workerProfile.designation} />
          <InfoRow label="Experience" value={workerProfile.experience_years ? `${workerProfile.experience_years} years` : null} />
          <InfoRow label="Zone" value={workerProfile.zone_assignment} />
          <InfoRow label="Date Joined" value={formatDate(workerProfile.date_joined)} />
          {workerProfile.certifications?.length > 0 && (
            <div className="pt-2">
              <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-2">Certifications</p>
              <div className="flex flex-wrap gap-1.5">
                {workerProfile.certifications.map((cert, i) => (
                  <span key={i} className="text-[11px] bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded-full">
                    {cert}
                  </span>
                ))}
              </div>
            </div>
          )}
          {!workerProfile.designation && !workerProfile.experience_years && (
            <button
              onClick={() => navigate(`${base}/edit`)}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              + Add work details
            </button>
          )}
        </SectionCard>
      )}

      {/* Health Summary */}
      {workerProfile && (
        <SectionCard
          title="Health Summary"
          icon={User}
          action={
            <button
              onClick={() => navigate(`${base}/edit`)}
              className="text-[11px] text-zinc-400 hover:text-white flex items-center gap-1"
            >
              Edit <ChevronRight className="w-3 h-3" />
            </button>
          }
        >
          <InfoRow label="Blood Group" value={workerProfile.blood_group?.replace("_POS", "+").replace("_NEG", "-")} />
          <InfoRow label="Last Checkup" value={formatDate(workerProfile.last_medical_checkup)} />
          <InfoRow label="Known Allergies" value={workerProfile.known_allergies} />
          <InfoRow label="Major Illness" value={workerProfile.major_illness} />
          <InfoRow label="Disability" value={workerProfile.disability} />
          <InfoRow label="Medications" value={workerProfile.medications} />
          {!workerProfile.blood_group && !workerProfile.major_illness && (
            <button
              onClick={() => navigate(`${base}/edit`)}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              + Add health details
            </button>
          )}
        </SectionCard>
      )}

      {/* Emergency Contact */}
      {workerProfile?.emergency_contact_name && (
        <SectionCard title="Emergency Contact" icon={Phone}>
          <InfoRow label="Name" value={workerProfile.emergency_contact_name} />
          <InfoRow label="Phone" value={workerProfile.emergency_contact_phone} />
          <InfoRow label="Relation" value={workerProfile.emergency_contact_relation} />
        </SectionCard>
      )}

      {/* No profile yet */}
      {!workerProfile && (
        <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-5 py-8 flex flex-col items-center gap-3 text-center">
          <User className="w-8 h-8 text-zinc-600" />
          <p className="text-sm font-medium text-zinc-400">Profile not set up yet</p>
          <p className="text-xs text-zinc-600">Fill in your details to complete your profile</p>
          <button
            onClick={() => navigate(`${base}/edit`)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-semibold text-white transition mt-1"
          >
            Set Up Profile
          </button>
        </div>
      )}
    </div>
  );
}