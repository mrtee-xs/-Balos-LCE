export default function BillingLoading() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-pulse">
      <div className="h-10 bg-surface-muted rounded-xl w-64" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-32 bg-surface-muted rounded-2xl" />
        <div className="h-32 bg-surface-muted rounded-2xl" />
        <div className="h-32 bg-surface-muted rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="h-96 bg-surface-muted rounded-2xl" />
        <div className="h-96 bg-surface-muted rounded-2xl" />
        <div className="h-96 bg-surface-muted rounded-2xl" />
        <div className="h-96 bg-surface-muted rounded-2xl" />
      </div>
    </div>
  );
}
