export default function ViewingsLoading() {
  return (
    <div className="space-y-6 animate-pulse max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="h-7 w-44 bg-border/60 rounded-lg" />
          <div className="h-4 w-60 bg-border/40 rounded-md" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-28 bg-border/40 rounded-xl" />
          <div className="h-9 w-32 bg-border/40 rounded-xl" />
        </div>
      </div>

      {/* Filter / Tabs */}
      <div className="flex gap-2 border-b border-border pb-3">
        <div className="h-8 w-24 bg-border/50 rounded-xl" />
        <div className="h-8 w-24 bg-border/30 rounded-xl" />
        <div className="h-8 w-24 bg-border/30 rounded-xl" />
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-surface border border-border shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 bg-border/60 rounded" />
              <div className="h-5 w-20 bg-border/40 rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="h-5 w-44 bg-border/60 rounded" />
              <div className="h-3.5 w-32 bg-border/40 rounded" />
            </div>
            <div className="pt-3 border-t border-border/60 flex items-center justify-between">
              <div className="h-4 w-24 bg-border/40 rounded" />
              <div className="h-8 w-20 bg-border/40 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
