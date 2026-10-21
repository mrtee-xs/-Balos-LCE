export default function CrmSettingsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-6 w-56 bg-border/60 rounded-lg mb-2" />
        <div className="h-4 w-96 bg-border/40 rounded-lg" />
      </div>

      <div className="bg-surface rounded-2xl border border-border p-5 h-36" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-surface rounded-2xl border border-border p-5 h-56" />
        ))}
      </div>
    </div>
  );
}
