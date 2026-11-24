// Display only. No rule is restated here (Task #03, separation of concerns).
import { BOOKINGS, NOW, ROOM, MAX_DURATION } from '@/data/samples';
import { minutesToLabel } from '@/lib/time';

export function RoomInfo({ blocked }: { blocked: boolean }) {
  return (
    <section className="card" aria-labelledby="room-heading">
      <h2 id="room-heading">{ROOM.name}</h2>
      <dl className="facts">
        <div>
          <dt>Current time</dt>
          <dd>{minutesToLabel(NOW)}</dd>
        </div>
        <div>
          <dt>Max duration</dt>
          <dd>{MAX_DURATION} min</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>
            <span className={blocked ? 'pill pill--blocked' : 'pill pill--open'}>
              {blocked ? 'Blocked' : 'Open'}
            </span>
          </dd>
        </div>
      </dl>

      <h3>Existing bookings</h3>
      <table className="bookings">
        <thead>
          <tr>
            <th scope="col">From</th>
            <th scope="col">To</th>
            <th scope="col">Booked by</th>
          </tr>
        </thead>
        <tbody>
          {BOOKINGS.map((b) => (
            <tr key={`${b.start}-${b.end}`}>
              <td>{minutesToLabel(b.start)}</td>
              <td>{minutesToLabel(b.end)}</td>
              <td>{b.bookedBy}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="note">Fictional data. No login, no database, no personal data.</p>
    </section>
  );
}
