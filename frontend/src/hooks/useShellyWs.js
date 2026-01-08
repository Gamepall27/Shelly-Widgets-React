import { useEffect, useRef, useState } from "react";

export function useShellyWs() {
  const [connected, setConnected] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3000/ws");
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
    };

    ws.onclose = () => {
      setConnected(false);
    };

    ws.onerror = () => {
      setConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);

        if (msg.type === "snapshot") {
          setMetrics(msg.state.metrics);
        }

        if (msg.type === "update") {
          setMetrics(msg.metrics);
        }
      } catch (e) {
        console.error("WS parse error", e);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  return {
    wsConnected: connected,
    metrics
  };
}
