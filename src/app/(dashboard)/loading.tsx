export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse max-w-7xl mx-auto">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 w-48 bg-border/60 rounded-lg" />
          <div className="h-4 w-72 bg-border/40 rounded-md" />
        </div>
        <div className="h-10 w-36 bg-border/40 rounded-xl" />
      </div>

      {/* KPI Cards (4 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-surface border border-border shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 bg-border/50 rounded" />
              <div className="h-8 w-8 bg-border/40 rounded-xl" />
            </div>
            <div className="h-8 w-16 bg-border/60 rounded-md" />
            <div className="h-3 w-28 bg-border/30 rounded" />
          </div>
        ))}
      </div>

      {/* Needs You Queue Skeleton */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 w-44 bg-border/60 rounded" />
          <div className="h-6 w-16 bg-border/40 rounded-full" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 bg-surface-subtle rounded-xl border border-border/60"
            />
          ))}
        </div>
      </div>

      {/* Upcoming Viewings & Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-surface rounded-2xl border border-border shadow-sm p-6 space-y-4">
          <div className="h-5 w-40 bg-border/60 rounded" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-14 bg-surface-subtle rounded-xl border border-border/60"
              />
            ))}
          </div>
        </div>
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 space-y-4">
          <div className="h-5 w-32 bg-border/60 rounded" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 bg-surface-subtle rounded-xl border border-border/60"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
