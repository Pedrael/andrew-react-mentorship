import JeopardyTable from '../components/jeopardy-table/JeopardyTable';

export default function PlayerLayout() {
  return (
    <section style={{ padding: 16 }}>
      <JeopardyTable isAdmin={false} />
    </section>
  );
}
