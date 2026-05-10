import { useState, useEffect } from "react";
import { Loader2, Save } from "lucide-react";

const BLOOD_GROUPS = ["A_POS", "A_NEG", "B_POS", "B_NEG", "AB_POS", "AB_NEG", "O_POS", "O_NEG", "UNKNOWN"];
const GENDERS = ["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"];
const DOMINANT_HANDS = ["LEFT", "RIGHT", "AMBIDEXTROUS"];
const FITNESS_STATUSES = ["CLEARED", "RESTRICTED", "UNFIT", "PENDING"];

const formatBloodGroup = (val) => val?.replace("_POS", "+").replace("_NEG", "-") || val;
const formatEnum = (val) => val?.replace(/_/g, " ") || val;

function SectionHeader({ title, description }) {
  return (
    <div className="mb-4">
      <h3 className="text-sm font-semibold text-zinc-200">{title}</h3>
      {description && <p className="text-[11px] text-zinc-500 mt-0.5">{description}</p>}
    </div>
  );
}

function FormField({ label, children, required }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] text-zinc-400 uppercase tracking-wider">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass = "w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition";
const selectClass = `${inputClass} cursor-pointer`;

export default function ProfileEditForm({
  workerProfile,
  updateProfile,
  profileLoading,
  isAdminView,
}) {
  const [form, setForm] = useState({
    // Personal
    gender: "",
    age: "",
    height_cm: "",
    weight_kg: "",
    blood_group: "",
    dominant_hand: "",
    identification_mark: "",
    // Health
    major_illness: "",
    disability: "",
    known_allergies: "",
    medications: "",
    last_medical_checkup: "",
    fitness_status: "PENDING",
    // Work
    designation: "",
    experience_years: "",
    zone_assignment: "",
    certifications: "",
    date_joined: "",
    // Emergency
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relation: "",
  });

  const [savedSections, setSavedSections] = useState({});

  // Populate form from existing profile
  useEffect(() => {
    if (!workerProfile) return;
    setForm({
      gender: workerProfile.gender || "",
      age: workerProfile.age || "",
      height_cm: workerProfile.height_cm || "",
      weight_kg: workerProfile.weight_kg || "",
      blood_group: workerProfile.blood_group || "",
      dominant_hand: workerProfile.dominant_hand || "",
      identification_mark: workerProfile.identification_mark || "",
      major_illness: workerProfile.major_illness || "",
      disability: workerProfile.disability || "",
      known_allergies: workerProfile.known_allergies || "",
      medications: workerProfile.medications || "",
      last_medical_checkup: workerProfile.last_medical_checkup
        ? workerProfile.last_medical_checkup.split("T")[0]
        : "",
      fitness_status: workerProfile.fitness_status || "PENDING",
      designation: workerProfile.designation || "",
      experience_years: workerProfile.experience_years || "",
      zone_assignment: workerProfile.zone_assignment || "",
      certifications: Array.isArray(workerProfile.certifications)
        ? workerProfile.certifications.join(", ")
        : "",
      date_joined: workerProfile.date_joined
        ? workerProfile.date_joined.split("T")[0]
        : "",
      emergency_contact_name: workerProfile.emergency_contact_name || "",
      emergency_contact_phone: workerProfile.emergency_contact_phone || "",
      emergency_contact_relation: workerProfile.emergency_contact_relation || "",
    });
  }, [workerProfile]);

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const handleSaveSection = async (section, fields) => {
    const sectionData = {};
    fields.forEach(key => {
      let val = form[key];
      if (val === "") val = null;
      if (key === "certifications" && val) {
        val = val.split(",").map(s => s.trim()).filter(Boolean);
      }
      if (["age", "height_cm", "weight_kg", "experience_years"].includes(key) && val) {
        val = parseFloat(val);
      }
      sectionData[key] = val;
    });

    const result = await updateProfile(sectionData);
    if (result.success) {
      setSavedSections(prev => ({ ...prev, [section]: true }));
      setTimeout(() => setSavedSections(prev => ({ ...prev, [section]: false })), 2000);
    }
  };

  const SaveButton = ({ section, fields }) => (
    <button
      onClick={() => handleSaveSection(section, fields)}
      disabled={profileLoading}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg text-xs font-semibold text-white transition mt-4"
    >
      {profileLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Save className="w-3.5 h-3.5" />
      )}
      {savedSections[section] ? "Saved!" : "Save Changes"}
    </button>
  );

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6 pb-8">

      {/* Personal Info */}
      <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-5 py-5">
        <SectionHeader
          title="Personal Information"
          description="Basic personal details"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Gender">
            <select
              value={form.gender}
              onChange={e => set("gender", e.target.value)}
              className={selectClass}
            >
              <option value="">Select gender</option>
              {GENDERS.map(g => (
                <option key={g} value={g}>{formatEnum(g)}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Age">
            <input
              type="number"
              min="18" max="70"
              value={form.age}
              onChange={e => set("age", e.target.value)}
              placeholder="e.g. 28"
              className={inputClass}
            />
          </FormField>

          <FormField label="Height (cm)">
            <input
              type="number"
              value={form.height_cm}
              onChange={e => set("height_cm", e.target.value)}
              placeholder="e.g. 170"
              className={inputClass}
            />
          </FormField>

          <FormField label="Weight (kg)">
            <input
              type="number"
              value={form.weight_kg}
              onChange={e => set("weight_kg", e.target.value)}
              placeholder="e.g. 70"
              className={inputClass}
            />
          </FormField>

          <FormField label="Blood Group">
            <select
              value={form.blood_group}
              onChange={e => set("blood_group", e.target.value)}
              className={selectClass}
            >
              <option value="">Select blood group</option>
              {BLOOD_GROUPS.map(bg => (
                <option key={bg} value={bg}>{formatBloodGroup(bg)}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Dominant Hand">
            <select
              value={form.dominant_hand}
              onChange={e => set("dominant_hand", e.target.value)}
              className={selectClass}
            >
              <option value="">Select hand</option>
              {DOMINANT_HANDS.map(h => (
                <option key={h} value={h}>{formatEnum(h)}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Identification Mark">
            <input
              type="text"
              value={form.identification_mark}
              onChange={e => set("identification_mark", e.target.value)}
              placeholder="e.g. Scar on left arm"
              className={inputClass}
            />
          </FormField>
        </div>
        <SaveButton
          section="personal"
          fields={["gender", "age", "height_cm", "weight_kg", "blood_group", "dominant_hand", "identification_mark"]}
        />
      </div>

      {/* Health Info */}
      <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-5 py-5">
        <SectionHeader
          title="Health Information"
          description="Medical conditions and fitness status"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Major Illness">
            <textarea
              value={form.major_illness}
              onChange={e => set("major_illness", e.target.value)}
              placeholder="e.g. Diabetes, Hypertension"
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </FormField>

          <FormField label="Disability">
            <textarea
              value={form.disability}
              onChange={e => set("disability", e.target.value)}
              placeholder="Any physical disability"
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </FormField>

          <FormField label="Known Allergies">
            <textarea
              value={form.known_allergies}
              onChange={e => set("known_allergies", e.target.value)}
              placeholder="e.g. Dust, Chemical solvents"
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </FormField>

          <FormField label="Medications">
            <textarea
              value={form.medications}
              onChange={e => set("medications", e.target.value)}
              placeholder="Medications that may affect alertness"
              rows={2}
              className={`${inputClass} resize-none`}
            />
          </FormField>

          <FormField label="Last Medical Checkup">
            <input
              type="date"
              value={form.last_medical_checkup}
              onChange={e => set("last_medical_checkup", e.target.value)}
              className={inputClass}
            />
          </FormField>

          {/* Only admin can set fitness status */}
          {isAdminView && (
            <FormField label="Fitness Status">
              <select
                value={form.fitness_status}
                onChange={e => set("fitness_status", e.target.value)}
                className={selectClass}
              >
                {FITNESS_STATUSES.map(s => (
                  <option key={s} value={s}>{formatEnum(s)}</option>
                ))}
              </select>
            </FormField>
          )}
        </div>
        <SaveButton
          section="health"
          fields={[
            "major_illness", "disability", "known_allergies",
            "medications", "last_medical_checkup",
            ...(isAdminView ? ["fitness_status"] : []),
          ]}
        />
      </div>

      {/* Work Info */}
      <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-5 py-5">
        <SectionHeader
          title="Work Information"
          description="Job role and experience details"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Designation">
            <input
              type="text"
              value={form.designation}
              onChange={e => set("designation", e.target.value)}
              placeholder="e.g. Mason, Welder, Electrician"
              className={inputClass}
            />
          </FormField>

          <FormField label="Experience (years)">
            <input
              type="number"
              min="0" max="50"
              step="0.5"
              value={form.experience_years}
              onChange={e => set("experience_years", e.target.value)}
              placeholder="e.g. 5"
              className={inputClass}
            />
          </FormField>

          {isAdminView && (
            <FormField label="Zone Assignment">
              <input
                type="text"
                value={form.zone_assignment}
                onChange={e => set("zone_assignment", e.target.value)}
                placeholder="e.g. Zone A, Floor 3"
                className={inputClass}
              />
            </FormField>
          )}

          <FormField label="Date Joined">
            <input
              type="date"
              value={form.date_joined}
              onChange={e => set("date_joined", e.target.value)}
              className={inputClass}
            />
          </FormField>

          <FormField
            label="Certifications"
            description="Comma separated"
          >
            <input
              type="text"
              value={form.certifications}
              onChange={e => set("certifications", e.target.value)}
              placeholder="e.g. Safety Training, Height Work, First Aid"
              className={inputClass}
            />
          </FormField>
        </div>
        <SaveButton
          section="work"
          fields={[
            "designation", "experience_years", "date_joined", "certifications",
            ...(isAdminView ? ["zone_assignment"] : []),
          ]}
        />
      </div>

      {/* Emergency Contact */}
      <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-5 py-5">
        <SectionHeader
          title="Emergency Contact"
          description="Person to contact in case of emergency"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Contact Name">
            <input
              type="text"
              value={form.emergency_contact_name}
              onChange={e => set("emergency_contact_name", e.target.value)}
              placeholder="Full name"
              className={inputClass}
            />
          </FormField>

          <FormField label="Phone Number">
            <input
              type="tel"
              value={form.emergency_contact_phone}
              onChange={e => set("emergency_contact_phone", e.target.value)}
              placeholder="+91 XXXXX XXXXX"
              className={inputClass}
            />
          </FormField>

          <FormField label="Relation">
            <input
              type="text"
              value={form.emergency_contact_relation}
              onChange={e => set("emergency_contact_relation", e.target.value)}
              placeholder="e.g. Spouse, Parent, Sibling"
              className={inputClass}
            />
          </FormField>
        </div>
        <SaveButton
          section="emergency"
          fields={["emergency_contact_name", "emergency_contact_phone", "emergency_contact_relation"]}
        />
      </div>
    </div>
  );
}