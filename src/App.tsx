import { useState } from 'react';
import { checkAvailability, type CheckOutcome } from '@/lib/availability';
import { CheckerForm } from '@/components/CheckerForm';
import { ResultBanner } from '@/components/ResultBanner';
import { RoomInfo } from '@/components/RoomInfo';

export default function App() {
  const [startText, setStartText] = useState('11:30');
  const [durationText, setDurationText] = useState('60');
  const [blocked, setBlocked] = useState(false);
  const [outcome, setOutcome] = useState<CheckOutcome | null>(null);

  return (
    <main className="page">
      <header className="page__header">
        <p className="eyebrow">Smart Campus</p>
        <h1>Room Availability Checker</h1>
        <p className="subtitle">
          Code-based solution &middot; Practice #13 &middot; one fictional room, fixed bookings
        </p>
      </header>

      <div className="layout">
        <CheckerForm
          startText={startText}
          durationText={durationText}
          blocked={blocked}
          invalidField={outcome?.field}
          onStartChange={(v) => {
            setStartText(v);
            setOutcome(null);
          }}
          onDurationChange={(v) => {
            setDurationText(v);
            setOutcome(null);
          }}
          onBlockedChange={(v) => {
            setBlocked(v);
            setOutcome(null);
          }}
          onSubmit={() => setOutcome(checkAvailability({ startText, durationText, blocked }))}
        />
        <RoomInfo blocked={blocked} />
      </div>

      <ResultBanner outcome={outcome} />
    </main>
  );
}
