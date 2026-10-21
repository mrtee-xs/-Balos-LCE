export default function ProfileSettingsLoading() {
  return (
    <div className="space-y-6 animate-pulse max-w-3xl">
      {/* Header */}
      <div className="space-y-1.5">
        <div className="h-7 w-48 bg-border/60 rounded-lg" />
        <div className="h-4 w-72 bg-border/40 rounded-md" />
      </div>

      {/* Form Card Skeleton */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm p-6 space-y-6">
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-32 bg-border/50 rounded" />
              <div className="h-10 w-full bg-surface-subtle border border-border/60 rounded-xl" />
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-border flex justify-end">
          <div className="h-10 w-32 bg-border/40 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
