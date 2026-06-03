/**
 * useWebSocket.js
 * Maintains a persistent WebSocket connection to the backend live stream.
 * Reconnects automatically on disconnect.
 */
import { useState, useEffect, useRef, useCallback } from 'react'

const WS_URL = 'ws://localhost:8000/ws/live'
const RECONNECT_DELAY = 2000
const MAX_HISTORY = 120  // points kept per signal for charts

export function useWebSocket() {
  const [data, setData]           = useState(null)
  const [connected, setConnected] = useState(false)
  const [lastTs, setLastTs]       = useState(null)

  // Per-signal chart history: { "milling.imbibition_water_pct": [{ts, value}, ...] }
  const chartHistory = useRef({})
  const ws           = useRef(null)
  const reconnTimer  = useRef(null)

  const connect = useCallback(() => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) return

    try {
      ws.current = new WebSocket(WS_URL)

      ws.current.onopen = () => {
        setConnected(true)
        clearTimeout(reconnTimer.current)
      }

      ws.current.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data)

          // Append live highlight values into chart history buffers
          if (msg.stage_highlights) {
            Object.entries(msg.stage_highlights).forEach(([stage, params]) => {
              Object.entries(params).forEach(([param, value]) => {
                const key = `${stage}.${param}`
                if (!chartHistory.current[key]) chartHistory.current[key] = []
                const buf = chartHistory.current[key]
                buf.push({ ts: msg.ts, value })
                if (buf.length > MAX_HISTORY) buf.shift()
              })
            })
          }

          setData(msg)
          setLastTs(msg.ts)
        } catch (e) {
          console.warn('WS parse error', e)
        }
      }

      ws.current.onclose = () => {
        setConnected(false)
        reconnTimer.current = setTimeout(connect, RECONNECT_DELAY)
      }

      ws.current.onerror = () => {
        ws.current?.close()
      }
    } catch (e) {
      console.error('WS connect error', e)
      reconnTimer.current = setTimeout(connect, RECONNECT_DELAY)
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnTimer.current)
      ws.current?.close()
    }
  }, [connect])

  const getChartHistory = useCallback((stage, param) => {
    return chartHistory.current[`${stage}.${param}`] || []
  }, [])

  return { data, connected, lastTs, getChartHistory }
}
