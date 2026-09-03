export default function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-slate-500">
      <span className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  );
}
