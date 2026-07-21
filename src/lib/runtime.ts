import type { BehaviorNode, RuntimeStatus } from '../types'

const STATUS_BY_NUMBER: Record<number, RuntimeStatus> = {
  0: 'IDLE',
  1: 'RUNNING',
  2: 'SUCCESS',
  3: 'FAILURE',
  4: 'SKIPPED',
}

export function normalizeStatus(value: unknown): RuntimeStatus | null {
  if (typeof value === 'number') return STATUS_BY_NUMBER[value] || null
  if (typeof value !== 'string') return null
  const normalized = value.toUpperCase().trim() as RuntimeStatus
  return ['IDLE', 'RUNNING', 'SUCCESS', 'FAILURE', 'SKIPPED'].includes(normalized) ? normalized : null
}

export function matchRuntimeNodes(reference: string, nodes: BehaviorNode[]) {
  const cleanRef = reference.trim()
  const pathTail = cleanRef.split('/').filter(Boolean).at(-1) || cleanRef
  const exactId = nodes.filter((node) => node.id === cleanRef)
  if (exactId.length) return exactId.map((node) => node.id)
  const exactName = nodes.filter((node) => node.data.label === cleanRef || node.data.registrationName === cleanRef)
  if (exactName.length) return exactName.map((node) => node.id)
  return nodes
    .filter((node) => node.data.label === pathTail || node.data.registrationName === pathTail)
    .map((node) => node.id)
}

export interface ParsedMonitorUpdate {
  reference: string
  status: RuntimeStatus
  timestamp?: number
}

export function parseMonitorMessage(raw: string): ParsedMonitorUpdate[] {
  const message = JSON.parse(raw) as Record<string, unknown>
  if (message.op === 'publish' && message.msg && typeof message.msg === 'object') {
    const rosMessage = message.msg as Record<string, unknown>
    if (typeof rosMessage.data === 'string') {
      try {
        return parseMonitorMessage(rosMessage.data)
      } catch {
        return []
      }
    }
    return parseEvent(rosMessage)
  }
  if (message.type === 'snapshot' && message.nodes && typeof message.nodes === 'object') {
    return Object.entries(message.nodes as Record<string, unknown>).flatMap(([reference, value]) => {
      const statusValue = value && typeof value === 'object' ? (value as Record<string, unknown>).status : value
      const status = normalizeStatus(statusValue)
      return status ? [{ reference, status, timestamp: Number(message.timestamp) || undefined }] : []
    })
  }
  if (Array.isArray(message.events)) {
    return message.events.flatMap((event) => {
      if (!event || typeof event !== 'object') return []
      return parseEvent(event as Record<string, unknown>)
    })
  }
  return parseEvent(message)
}

function parseEvent(message: Record<string, unknown>): ParsedMonitorUpdate[] {
  const reference = message.nodeId ?? message.uid ?? message.node ?? message.name ?? message.path
  const status = normalizeStatus(message.status)
  if ((typeof reference !== 'string' && typeof reference !== 'number') || !status) return []
  return [{ reference: String(reference), status, timestamp: Number(message.timestamp) || undefined }]
}
