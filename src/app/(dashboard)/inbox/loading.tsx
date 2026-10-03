export default function InboxLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] border border-border rounded-2xl bg-surface overflow-hidden shadow-sm animate-pulse">
      {/* Left Column: Lead List (w-80 or w-96) */}
      <div className="w-full md:w-80 lg:w-96 border-r border-border flex flex-col bg-surface">
        {/* Search header placeholder */}
        <div className="p-3 border-b border-border space-y-2">
          <div className="h-9 bg-border/40 rounded-xl" />
          <div className="flex gap-2">
            <div className="h-7 w-20 bg-border/40 rounded-lg" />
            <div className="h-7 w-20 bg-border/40 rounded-lg" />
          </div>
        </div>

        {/* Lead items placeholders */}
        <div className="flex-1 p-2 space-y-2 overflow-hidden">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div
              key={i}
              className="p-3 rounded-xl border border-border/60 bg-surface-subtle space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="h-4 w-28 bg-border/60 rounded" />
                <div className="h-3 w-12 bg-border/40 rounded" />
              </div>
              <div className="h-3 w-40 bg-border/40 rounded" />
              <div className="flex gap-2 pt-1">
                <div className="h-4 w-16 bg-border/40 rounded-full" />
                <div className="h-4 w-12 bg-border/30 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Chat Panel */}
      <div className="hidden md:flex flex-1 flex-col bg-sand-light/20">
        {/* Top bar placeholder */}
        <div className="p-4 border-b border-border bg-surface flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-border/50" />
            <div className="space-y-1.5">
              <div className="h-4 w-36 bg-border/60 rounded" />
              <div className="h-3 w-24 bg-border/40 rounded" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-9 w-28 bg-border/40 rounded-xl" />
            <div className="h-9 w-24 bg-border/40 rounded-xl" />
          </div>
        </div>

        {/* Messages placeholder */}
        <div className="flex-1 p-6 space-y-4">
          <div className="flex justify-start">
            <div className="h-14 w-64 bg-surface rounded-2xl border border-border/80 p-3" />
          </div>
          <div className="flex justify-end">
            <div className="h-12 w-56 bg-creek/20 rounded-2xl p-3" />
          </div>
          <div className="flex justify-start">
            <div className="h-20 w-80 bg-surface rounded-2xl border border-border/80 p-3" />
          </div>
        </div>

        {/* Input placeholder */}
        <div className="p-4 border-t border-border bg-surface">
          <div className="h-11 bg-border/40 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
