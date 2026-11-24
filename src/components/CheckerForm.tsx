// Display and input collection only. The verdict comes from the caller.
interface Props {
  startText: string;
  durationText: string;
  blocked: boolean;
  invalidField?: 'start' | 'duration';
  onStartChange: (v: string) => void;
  onDurationChange: (v: string) => void;
  onBlockedChange: (v: boolean) => void;
  onSubmit: () => void;
}

export function CheckerForm(props: Props) {
  return (
    <form
      className="card"
      onSubmit={(e) => {
        e.preventDefault();
        props.onSubmit();
      }}
    >
      <h2>Check a time slot</h2>

      <div className="field">
        <label htmlFor="start">Start time (HH:MM)</label>
        <input
          id="start"
          name="start"
          inputMode="numeric"
          autoComplete="off"
          placeholder="11:30"
          value={props.startText}
          aria-invalid={props.invalidField === 'start'}
          onChange={(e) => props.onStartChange(e.target.value)}
        />
      </div>

      <div className="field">
        <label htmlFor="duration">Duration (minutes, 1-120)</label>
        <input
          id="duration"
          name="duration"
          inputMode="numeric"
          autoComplete="off"
          placeholder="60"
          value={props.durationText}
          aria-invalid={props.invalidField === 'duration'}
          onChange={(e) => props.onDurationChange(e.target.value)}
        />
      </div>

      <div className="field field--switch">
        <input
          id="blocked"
          type="checkbox"
          checked={props.blocked}
          onChange={(e) => props.onBlockedChange(e.target.checked)}
        />
        <label htmlFor="blocked">Room is blocked (maintenance)</label>
      </div>

      <button type="submit">Check availability</button>
    </form>
  );
}
