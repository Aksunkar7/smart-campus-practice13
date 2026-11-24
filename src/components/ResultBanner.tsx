// Display only. It renders the outcome it is handed and decides nothing.
import type { CheckOutcome } from '@/lib/availability';

export function ResultBanner({ outcome }: { outcome: CheckOutcome | null }) {
  if (!outcome) {
    return (
      <p className="banner banner--idle" role="status">
        Enter a start time and a duration, then choose <strong>Check availability</strong>.
      </p>
    );
  }

  const tone = outcome.available
    ? 'banner--ok'
    : outcome.ac === 'AC1' || outcome.ac === 'AC2' || outcome.ac === 'AC6'
      ? 'banner--invalid'
      : 'banner--no';

  return (
    <div className={`banner ${tone}`} role="status" aria-live="polite">
      <p className="banner__verdict">
        {outcome.available ? 'Available' : outcome.ac === 'AC3' || outcome.ac === 'AC4' ? 'Unavailable' : 'Invalid input'}
      </p>
      <p className="banner__message">{outcome.message}</p>
      <p className="banner__meta">
        <span>reason code: <code>{outcome.reasonCode}</code></span>
        <span>criterion: <code>{outcome.ac}</code></span>
      </p>
    </div>
  );
}
