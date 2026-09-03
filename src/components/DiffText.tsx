import { wordDiff, type DiffOp } from '../lib/diff';

interface Props {
  from: string;
  to: string;
  /** 'additions' shows what the correct text adds/keeps; 'both' shows deletions too. */
  mode?: 'additions' | 'both';
  className?: string;
}

/** Renders `to` with the changes from `from` highlighted. */
export default function DiffText({ from, to, mode = 'both', className }: Props) {
  const ops: DiffOp[] = wordDiff(from, to);
  return (
    <span className={className}>
      {ops.map((op, i) => {
        if (op.type === 'same') return <span key={i}>{op.value} </span>;
        if (op.type === 'add')
          return (
            <span key={i} className="rounded bg-emerald-200/80 px-0.5 text-emerald-900">
              {op.value}{' '}
            </span>
          );
        if (mode === 'both')
          return (
            <span key={i} className="rounded bg-red-200/70 px-0.5 text-red-900 line-through">
              {op.value}{' '}
            </span>
          );
        return null;
      })}
    </span>
  );
}
