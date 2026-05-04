import { useState } from 'react';
import { useWebSocket } from '../lib/websocket/useWebSocket';
import type { ServerMessage } from '../lib/websocket/messages';

/**
 * Example showing both sides of the relay protocol in a single screen:
 *  - the AdminPanel sends `open_question` events
 *  - the PlayerPanel listens for them and renders the latest one
 *
 * In the real app these two panels live on different routes / different
 * machines, but for a demo it's convenient to mount them together.
 *
 * To use:
 *   1. Start the server:  cd server && npm run dev
 *   2. Render <WebSocketExample /> from App.tsx (or open it on a route).
 *   3. Open the page in two tabs to see real cross-tab traffic.
 *
 * Configure the URL via VITE_WS_URL (defaults to ws://localhost:8080).
 */

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080';

interface QuestionPayload {
  id: number;
  category: string;
  text: string;
  value: number;
}

const SAMPLE_QUESTIONS: QuestionPayload[] = [
  { id: 1, category: 'History', text: 'In what year did WW2 end?', value: 100 },
  { id: 2, category: 'Science', text: 'What is the chemical symbol for gold?', value: 200 },
  { id: 3, category: 'Cinema', text: 'Who directed Inception?', value: 300 },
];

export function WebSocketExample() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, padding: 24 }}>
      <AdminPanel />
      <PlayerPanel />
    </div>
  );
}

function AdminPanel() {
  const { status, send } = useWebSocket({
    url: WS_URL,
    role: 'admin',
    name: 'demo-admin',
    onMessage: (msg) => console.log('[admin] received', msg),
  });

  const handleOpen = (q: QuestionPayload) => {
    const ok = send<QuestionPayload>('open_question', q);
    if (!ok) console.warn('[admin] socket not open, message dropped');
  };

  const handleClose = () => {
    send('close_question', null);
  };

  return (
    <Panel title="Admin (sender)" status={status}>
      <p>Pick a question to broadcast to all players:</p>
      <ul style={{ paddingLeft: 16 }}>
        {SAMPLE_QUESTIONS.map((q) => (
          <li key={q.id} style={{ marginBottom: 8 }}>
            <button onClick={() => handleOpen(q)} disabled={status !== 'open'}>
              Open #{q.id} — {q.category} ({q.value})
            </button>
          </li>
        ))}
      </ul>
      <button onClick={handleClose} disabled={status !== 'open'}>
        Close currently open question
      </button>
    </Panel>
  );
}

function PlayerPanel() {
  const [openQuestion, setOpenQuestion] = useState<QuestionPayload | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const { status } = useWebSocket({
    url: WS_URL,
    role: 'player',
    name: 'demo-player',
    onEvent: (event, payload) => {
      setLog((prev) => [`${new Date().toLocaleTimeString()} ${event}`, ...prev].slice(0, 10));
      if (event === 'open_question') setOpenQuestion(payload as QuestionPayload);
      if (event === 'close_question') setOpenQuestion(null);
    },
    onMessage: (msg: ServerMessage) => {
      if (msg.type === 'system') {
        setLog((prev) =>
          [`${new Date().toLocaleTimeString()} system:${msg.event}`, ...prev].slice(0, 10),
        );
      }
    },
  });

  return (
    <Panel title="Player (receiver)" status={status}>
      {openQuestion ? (
        <div style={{ border: '1px solid #888', padding: 12, marginBottom: 12 }}>
          <strong>{openQuestion.category}</strong> — ${openQuestion.value}
          <p style={{ marginTop: 8 }}>{openQuestion.text}</p>
        </div>
      ) : (
        <p style={{ color: '#888' }}>Waiting for the admin to open a question…</p>
      )}
      <details>
        <summary>Event log ({log.length})</summary>
        <ul>
          {log.map((entry, i) => (
            <li key={i}>{entry}</li>
          ))}
        </ul>
      </details>
    </Panel>
  );
}

interface PanelProps {
  title: string;
  status: 'connecting' | 'open' | 'closed';
  children: React.ReactNode;
}

function Panel({ title, status, children }: PanelProps) {
  return (
    <section style={{ border: '1px solid #ccc', borderRadius: 8, padding: 16 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>{title}</h2>
        <StatusBadge status={status} />
      </header>
      {children}
    </section>
  );
}

function StatusBadge({ status }: { status: 'connecting' | 'open' | 'closed' }) {
  const color = status === 'open' ? '#2a8' : status === 'connecting' ? '#c84' : '#c44';
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 999,
        background: color,
        color: 'white',
        fontSize: 12,
      }}
    >
      {status}
    </span>
  );
}
