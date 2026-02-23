import { useEffect, useRef, useState } from 'react';

export function useLatency(socket: WebSocket | null, intervalMs = 2000) {
  const [rtt, setRtt] = useState<number | null>(null);
  const pending = useRef<Map<number, number>>(new Map());

  useEffect(() => {
    if (!socket) {
      setRtt(null);
      return;
    }

    const handleMessage = (ev: MessageEvent) => {
      try {
        const msg = JSON.parse(ev.data) as { t: string; nonce?: number };
        if (msg.t === 'Pong' && typeof msg.nonce === 'number') {
          const sent = pending.current.get(msg.nonce);
          if (sent !== undefined) {
            setRtt(Date.now() - sent);
            pending.current.delete(msg.nonce);
          }
        }
      } catch {
        // ignore parsing errors
      }
    };

    socket.addEventListener('message', handleMessage);

    const timer = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        const nonce = Date.now();
        pending.current.set(nonce, nonce);
        socket.send(JSON.stringify({ t: 'Ping', nonce }));
      }
    }, intervalMs);

    return () => {
      clearInterval(timer);
      socket.removeEventListener('message', handleMessage);
      pending.current.clear();
    };
  }, [socket, intervalMs]);

  return rtt;
}

