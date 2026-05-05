import JeopardyTable from '../components/jeopardy-table/JeopardyTable';
import PlayerManagementForm from '../components/player-management-form/PlayerManagementForm';

export default function PlayerLayout() {
  return (
    <section style={{ padding: 16 }}>
      <JeopardyTable isAdmin={true} />
      <PlayerManagementForm />
    </section>
  );
}
