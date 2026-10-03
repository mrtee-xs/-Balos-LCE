export default function PropertiesLoading() {
  return (
    <div className="space-y-6 animate-pulse max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="h-7 w-40 bg-border/60 rounded-lg" />
          <div className="h-4 w-64 bg-border/40 rounded-md" />
        </div>
        <div className="h-10 w-36 bg-border/40 rounded-xl" />
      </div>

      {/* Grid of property cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-surface overflow-hidden shadow-sm space-y-4"
          >
            {/* Image Placeholder */}
            <div className="h-48 bg-border/40 w-full" />
            <div className="p-5 space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-4 w-28 bg-border/50 rounded" />
                <div className="h-4 w-16 bg-border/40 rounded-full" />
              </div>
              <div className="h-5 w-48 bg-border/60 rounded" />
              <div className="h-6 w-32 bg-border/70 rounded" />
              <div className="pt-3 border-t border-border/60 flex justify-between">
                <div className="h-4 w-24 bg-border/40 rounded" />
                <div className="h-4 w-20 bg-border/40 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
