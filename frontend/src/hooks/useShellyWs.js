import { useEffect, useMemo, useRef, useState } from "react";

function getWsUrl(path = "/ws") {
  // Nutzt aktuellen Host/Port (z.B. Vite: localhost:5173) + Proxy
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}${path}`;
}

export function useShellyWs() {
  const [wsConnected, setWsConnected] = useState(false);
  const [state, setState] = useState(null);

  const wsRef = useRef(null);
  const retryRef = useRef(0);
  const timerRef = useRef(null);

  const url = useMemo(() => getWsUrl("/ws"), []);

  useEffect(() => {
    let stopped = false;

    const connect = () => {
      if (stopped) return;

      // Cleanup alter Verbindung (falls vorhanden)
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {
          // ignore
        }
        wsRef.current = null;
      }

      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        retryRef.current = 0;
        setWsConnected(true);
      };

      ws.onclose = () => {
        setWsConnected(false);
        if (stopped) return;

        // simple backoff: 0.5s, 1s, 2s, 4s, 5s...
        const attempt = (retryRef.current += 1);
        const delay = Math.min(5000, 500 * Math.pow(2, attempt - 1));

        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(connect, delay);
      };

      ws.onerror = () => {
        // onclose kommt meist danach sowieso
        setWsConnected(false);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === "snapshot") {
            setState(msg.state);
            return;
          }

          if (msg.type === "update") {
            // Erwartung: msg.state ODER msg.metrics/devices.
            // Am besten Backend sendet msg.state.
            if (msg.state) {
              setState(msg.state);
            } else {
              // Fallback: legacy
              setState((prev) => {
                const p = prev || {};
                return {
                  ...p,
                  metrics: msg.metrics ?? p.metrics,
                  devices: msg.devices ?? p.devices,
                };
              });
            }
          }
        } catch (e) {
          console.error("WS parse error", e);
        }
      };
    };

    connect();

    return () => {
      stopped = true;
      clearTimeout(timerRef.current);
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {
          // ignore
        }
      }
    };
  }, [url]);

  return { wsConnected, state };
}
