export default function StatusBar({ ws="Disconnected", camera="Inactive", fps="0.0" }) {
  return (
    <div className="hidden">{ws}{camera}{fps}</div>
  );
}
