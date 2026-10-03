export default function LeadsLoading() {
  return (
    <div className="space-y-6 animate-pulse max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5">
          <div className="h-7 w-48 bg-border/60 rounded-lg" />
          <div className="h-4 w-64 bg-border/40 rounded-md" />
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-surface rounded-2xl border border-border p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="h-9 w-full sm:w-80 bg-border/40 rounded-xl" />
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="h-9 w-32 bg-border/40 rounded-xl" />
          <div className="h-9 w-36 bg-border/40 rounded-xl" />
        </div>
      </div>

      {/* Table Skeleton with Header + 8 Rows */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-surface-subtle border-b border-border">
              <tr>
                <th className="py-3.5 px-4"><div className="h-3 w-16 bg-border/60 rounded" /></th>
                <th className="py-3.5 px-3"><div className="h-3 w-14 bg-border/60 rounded" /></th>
                <th className="py-3.5 px-3"><div className="h-3 w-20 bg-border/60 rounded" /></th>
                <th className="py-3.5 px-3"><div className="h-3 w-16 bg-border/60 rounded" /></th>
                <th className="py-3.5 px-3"><div className="h-3 w-24 bg-border/60 rounded" /></th>
                <th className="py-3.5 px-3"><div className="h-3 w-16 bg-border/60 rounded" /></th>
                <th className="py-3.5 px-4 text-right"><div className="h-3 w-20 bg-border/60 rounded ml-auto" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <tr key={i}>
                  <td className="py-3.5 px-4 space-y-1.5">
                    <div className="h-4 w-32 bg-border/60 rounded" />
                    <div className="h-3 w-24 bg-border/40 rounded" />
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="h-5 w-20 bg-border/40 rounded-full" />
                  </td>
                  <td className="py-3.5 px-3 space-y-1">
                    <div className="h-4 w-12 bg-border/60 rounded" />
                    <div className="h-3 w-10 bg-border/40 rounded" />
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="h-4 w-28 bg-border/50 rounded" />
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="flex gap-1">
                      <div className="h-4 w-16 bg-border/40 rounded" />
                      <div className="h-4 w-16 bg-border/40 rounded" />
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="h-5 w-16 bg-border/40 rounded-full" />
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="h-3.5 w-24 bg-border/40 rounded ml-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
