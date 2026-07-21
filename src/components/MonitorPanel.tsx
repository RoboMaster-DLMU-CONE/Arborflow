import { Activity, CircleStop, PlugZap, RotateCw, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { matchRuntimeNodes, parseMonitorMessage } from '../lib/runtime'
import type { BehaviorNode, RuntimeEvent, RuntimeStatus } from '../types'

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error'

interface MonitorPanelProps {
  open: boolean
  nodes: BehaviorNode[]
  onClose: () => void
  onRuntimeUpdate: (nodeIds: string[], status: RuntimeStatus) => void
  onClearStatuses: () => void
}

const STATE_LABEL: Record<ConnectionState, string> = {
  disconnected: '未连接', connecting: '连接中', connected: '已连接', error: '连接错误',
}

export function MonitorPanel({ open, nodes, onClose, onRuntimeUpdate, onClearStatuses }: MonitorPanelProps) {
  const [endpoint, setEndpoint] = useState(() => localStorage.getItem('arborflow.monitor.endpoint') || 'ws://127.0.0.1:1667')
  const [rosTopic, setRosTopic] = useState(() => localStorage.getItem('arborflow.monitor.topic') || '/arborflow/status')
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')
  const [shouldConnect, setShouldConnect] = useState(false)
  const [autoReconnect, setAutoReconnect] = useState(true)
  const [events, setEvents] = useState<RuntimeEvent[]>([])
  const [messageCount, setMessageCount] = useState(0)
  const [lastLatency, setLastLatency] = useState<number | null>(null)
  const socketRef = useRef<WebSocket | null>(null)
  const nodesRef = useRef(nodes)
  const runtimeUpdateRef = useRef(onRuntimeUpdate)

  nodesRef.current = nodes
  runtimeUpdateRef.current = onRuntimeUpdate

  useEffect(() => {
    if (!shouldConnect) return
    let disposed = false
    let reconnectTimer: number | undefined
    let pingTimer: number | undefined

    const connect = () => {
      if (disposed) return
      setConnectionState('connecting')
      localStorage.setItem('arborflow.monitor.endpoint', endpoint)
      localStorage.setItem('arborflow.monitor.topic', rosTopic)
      let socket: WebSocket
      try {
        socket = new WebSocket(endpoint)
      } catch {
        setConnectionState('error')
        return
      }
      socketRef.current = socket
      socket.onopen = () => {
        setConnectionState('connected')
        socket.send(JSON.stringify({ type: 'subscribe', client: 'ArborFlow', protocol: 1 }))
        socket.send(JSON.stringify({ op: 'subscribe', topic: rosTopic, type: 'std_msgs/msg/String' }))
        pingTimer = window.setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }))
        }, 5000)
      }
      socket.onmessage = (event) => {
        setMessageCount((count) => count + 1)
        try {
          const raw = typeof event.data === 'string' ? event.data : ''
          const parsed = JSON.parse(raw) as Record<string, unknown>
          if (parsed.type === 'pong' && typeof parsed.timestamp === 'number') {
            setLastLatency(Math.max(0, Date.now() - parsed.timestamp))
            return
          }
          const updates = parseMonitorMessage(raw)
          updates.forEach((update) => {
            const matchedNodeIds = matchRuntimeNodes(update.reference, nodesRef.current)
            runtimeUpdateRef.current(matchedNodeIds, update.status)
            const runtimeEvent: RuntimeEvent = {
              id: crypto.randomUUID(),
              at: update.timestamp || Date.now(),
              nodeRef: update.reference,
              status: update.status,
              matchedNodeIds,
            }
            setEvents((current) => [runtimeEvent, ...current].slice(0, 80))
          })
        } catch {
          const invalidEvent: RuntimeEvent = { id: crypto.randomUUID(), at: Date.now(), nodeRef: 'Invalid JSON', status: 'SKIPPED', matchedNodeIds: [] }
          setEvents((current) => [invalidEvent, ...current].slice(0, 80))
        }
      }
      socket.onerror = () => setConnectionState('error')
      socket.onclose = () => {
        window.clearInterval(pingTimer)
        socketRef.current = null
        if (disposed) return
        setConnectionState('disconnected')
        if (autoReconnect) reconnectTimer = window.setTimeout(connect, 1800)
      }
    }

    connect()
    return () => {
      disposed = true
      window.clearTimeout(reconnectTimer)
      window.clearInterval(pingTimer)
      socketRef.current?.close()
      socketRef.current = null
    }
  }, [shouldConnect, endpoint, rosTopic, autoReconnect])

  const disconnect = () => {
    setShouldConnect(false)
    socketRef.current?.close()
    setConnectionState('disconnected')
  }

  if (!open) return null

  return (
    <section className="monitor-panel">
      <div className="monitor-header">
        <div className="monitor-title"><Activity size={17} /><strong>Real-time Monitor</strong><span className={`connection-pill ${connectionState}`}><i />{STATE_LABEL[connectionState]}</span></div>
        <div className="monitor-actions">
          <button className="icon-button compact" onClick={() => { setEvents([]); onClearStatuses() }} title="清空运行状态"><Trash2 size={15} /></button>
          <button className="icon-button compact" onClick={onClose} title="关闭监视器"><X size={16} /></button>
        </div>
      </div>
      <div className="monitor-body">
        <div className="monitor-connect">
          <div className="field-group">
            <label htmlFor="monitor-endpoint">ROS WebSocket 地址</label>
            <div className="endpoint-row">
              <input id="monitor-endpoint" className="mono" value={endpoint} onChange={(event) => setEndpoint(event.target.value)} disabled={shouldConnect} />
              {shouldConnect ? (
                <button className="secondary-button" onClick={disconnect}><CircleStop size={15} />断开</button>
              ) : (
                <button className="primary-button" onClick={() => setShouldConnect(true)}><PlugZap size={15} />连接</button>
              )}
            </div>
          </div>
          <div className="field-group topic-field">
            <label htmlFor="monitor-topic">rosbridge Topic</label>
            <input id="monitor-topic" className="mono" value={rosTopic} onChange={(event) => setRosTopic(event.target.value)} disabled={shouldConnect} />
          </div>
          <label className="toggle-row compact-toggle">
            <span><span className="toggle-title">自动重连</span></span>
            <input type="checkbox" checked={autoReconnect} onChange={(event) => setAutoReconnect(event.target.checked)} />
          </label>
          <div className="monitor-metrics">
            <div><span>消息</span><strong>{messageCount}</strong></div>
            <div><span>延迟</span><strong>{lastLatency === null ? '--' : `${lastLatency} ms`}</strong></div>
            <div><span>匹配</span><strong>{events.filter((event) => event.matchedNodeIds.length).length}</strong></div>
          </div>
        </div>
        <div className="runtime-legend">
          {(['RUNNING', 'SUCCESS', 'FAILURE', 'IDLE', 'SKIPPED'] as RuntimeStatus[]).map((status) => <span key={status}><i className={`runtime-${status.toLowerCase()}`} />{status}</span>)}
        </div>
        <div className="event-stream">
          <div className="event-stream-heading"><span>事件流</span>{connectionState === 'connecting' && <RotateCw className="spin" size={14} />}</div>
          <div className="event-list">
            {!events.length && <div className="event-empty">等待节点状态</div>}
            {events.map((event) => (
              <div className="event-row" key={event.id}>
                <time>{new Date(event.at).toLocaleTimeString('zh-CN', { hour12: false })}</time>
                <i className={`runtime-${event.status.toLowerCase()}`} />
                <span className="event-node" title={event.nodeRef}>{event.nodeRef}</span>
                <span className={`event-status runtime-${event.status.toLowerCase()}`}>{event.status}</span>
                {!event.matchedNodeIds.length && <span className="unmatched">未匹配</span>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
