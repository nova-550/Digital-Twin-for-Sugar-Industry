/**
 * useStageDetail.js
 * Fetches full stage data via REST and keeps it fresh every 2s.
 */
import { useState, useEffect, useRef } from 'react'

export function useStageDetail(stageId) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const timer = useRef(null)

  useEffect(() => {
    if (!stageId) return
    let cancelled = false

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/stage/${stageId}`)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        if (!cancelled) {
          setData(json)
          setLoading(false)
          setError(null)
        }
      } catch (e) {
        if (!cancelled) setError(e.message)
      }
    }

    fetchData()
    timer.current = setInterval(fetchData, 2000)

    return () => {
      cancelled = true
      clearInterval(timer.current)
    }
  }, [stageId])

  return { data, loading, error }
}

export function useParamHistory(stageId, param, n = 120) {
  const [history, setHistory] = useState([])
  const timer = useRef(null)

  useEffect(() => {
    if (!stageId || !param) return
    let cancelled = false

    const fetch_ = async () => {
      try {
        const res = await fetch(`/api/history/${stageId}/${param}?n=${n}`)
        const json = await res.json()
        if (!cancelled) setHistory(json.data || [])
      } catch (_) {}
    }

    fetch_()
    timer.current = setInterval(fetch_, 2000)
    return () => { cancelled = true; clearInterval(timer.current) }
  }, [stageId, param, n])

  return history
}
