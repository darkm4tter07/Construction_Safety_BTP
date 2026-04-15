import { useRef, useState } from "react";
import { Pencil, Loader2, Shield, AlertTriangle, XCircle } from "lucide-react";

const FITNESS_STATUS_CONFIG = {
  CLEARED: { label: "Cleared for Work", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20", icon: Shield },
  RESTRICTED: { label: "Restricted", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20", icon: AlertTriangle },
  UNFIT: { label: "Unfit for Work", color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", icon: XCircle },
  PENDING: { label: "Assessment Pending", color: "text-zinc-400", bg: "bg-zinc-500/10 border-zinc-500/20", icon: AlertTriangle },
};

export default function ProfileHeader({
  profileUser,
  workerProfile,
  isAdminView,
  photoUploading,
  onPhotoUpload,
  getBMI,
  getBMICategory,
}) {
  const fileInputRef = useRef(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const displayPhoto = workerProfile?.profile_photo_url || profileUser?.profile_picture;
  const bmi = getBMI();
  const bmiCategory = getBMICategory(bmi);
  const statusConfig = FITNESS_STATUS_CONFIG[workerProfile?.fitness_status || "PENDING"];
  const StatusIcon = statusConfig.icon;

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setShowPhotoModal(true);
  };

  const handleConfirmUpload = async () => {
    if (!selectedFile) return;
    await onPhotoUpload(selectedFile);
    setShowPhotoModal(false);
    setPreviewUrl(null);
    setSelectedFile(null);
  };

  const handleCancelUpload = () => {
    setShowPhotoModal(false);
    setPreviewUrl(null);
    setSelectedFile(null);
  };

  const stats = [
    { label: "Age", value: workerProfile?.age ? `${workerProfile.age} yrs` : "—" },
    { label: "Experience", value: workerProfile?.experience_years ? `${workerProfile.experience_years} yrs` : "—" },
    { label: "Designation", value: workerProfile?.designation || "—" },
    { label: "Blood Group", value: workerProfile?.blood_group?.replace("_POS", "+").replace("_NEG", "-") || "—" },
    { label: "BMI", value: bmi ? `${bmi}` : "—", extra: bmiCategory ? <span className={`text-[10px] ${bmiCategory.color}`}>{bmiCategory.label}</span> : null },
    { label: "Zone", value: workerProfile?.zone_assignment || "—" },
  ];

  return (
    <>
      <div className="bg-zinc-800 rounded-xl border border-zinc-700 overflow-hidden">

        {/* Top section — photo + name + status */}
        <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">

          {/* Photo */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-zinc-700 border-2 border-zinc-600">
              {displayPhoto ? (
                <img
                  src={displayPhoto}
                  alt={profileUser?.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-zinc-400">
                  {profileUser?.full_name?.charAt(0)}
                </div>
              )}
            </div>

            {/* Pencil button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={photoUploading}
              className="absolute bottom-0 right-0 w-6 h-6 bg-blue-600 hover:bg-blue-500 rounded-full flex items-center justify-center transition disabled:opacity-50"
            >
              {photoUploading ? (
                <Loader2 className="w-3 h-3 text-white animate-spin" />
              ) : (
                <Pencil className="w-3 h-3 text-white" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* Name + info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-base sm:text-lg font-semibold text-zinc-100 truncate">
                {profileUser?.full_name}
              </h1>
              {isAdminView && (
                <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 shrink-0">
                  Admin View
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-zinc-400">
              <span>{profileUser?.email}</span>
              <span className="text-zinc-600">·</span>
              <span>{profileUser?.employee_id || "No ID"}</span>
              <span className="text-zinc-600">·</span>
              <span className="capitalize">{profileUser?.role?.toLowerCase()}</span>
            </div>
          </div>

          {/* Fitness status badge */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium shrink-0 ${statusConfig.bg} ${statusConfig.color}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            <span>{statusConfig.label}</span>
          </div>
        </div>

        {/* Stats row */}
        <div className="border-t border-zinc-700 grid grid-cols-3 sm:grid-cols-6">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`px-3 sm:px-4 py-3 flex flex-col gap-0.5 ${
                i < stats.length - 1 ? "border-r border-zinc-700" : ""
              }`}
            >
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{stat.label}</span>
              <span className="text-xs font-medium text-zinc-200">{stat.value}</span>
              {stat.extra}
            </div>
          ))}
        </div>
      </div>

      {/* Photo confirmation modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden w-full max-w-sm">
            <div className="px-5 py-4 border-b border-zinc-700">
              <h3 className="text-sm font-semibold text-white">Update Profile Photo</h3>
            </div>
            <div className="p-5 flex flex-col items-center gap-4">
              <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-zinc-600">
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <p className="text-xs text-zinc-400 text-center">
                This will replace your current profile photo
              </p>
            </div>
            <div className="px-5 py-3 border-t border-zinc-700 flex gap-2 justify-end">
              <button
                onClick={handleCancelUpload}
                className="px-4 py-2 text-xs text-zinc-400 hover:text-white border border-zinc-700 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmUpload}
                disabled={photoUploading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-xs font-semibold text-white transition"
              >
                {photoUploading && <Loader2 className="w-3 h-3 animate-spin" />}
                {photoUploading ? "Uploading..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}