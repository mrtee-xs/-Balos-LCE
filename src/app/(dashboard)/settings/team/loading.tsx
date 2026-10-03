export default function TeamSettingsLoading() {
  return (
    <div className="space-y-6 animate-pulse max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="h-7 w-40 bg-border/60 rounded-lg" />
          <div className="h-4 w-64 bg-border/40 rounded-md" />
        </div>
        <div className="h-10 w-32 bg-border/40 rounded-xl" />
      </div>

      {/* Team Members List Skeleton */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm divide-y divide-border/60 overflow-hidden">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-border/50" />
              <div className="space-y-1.5">
                <div className="h-4 w-32 bg-border/60 rounded" />
                <div className="h-3 w-44 bg-border/40 rounded" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-16 bg-border/40 rounded-full" />
              <div className="h-8 w-8 bg-border/30 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
