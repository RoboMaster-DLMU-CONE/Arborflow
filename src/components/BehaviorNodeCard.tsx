import { Handle, Position, type NodeProps } from '@xyflow/react'
import { CircleDot, OctagonAlert } from 'lucide-react'
import { NODE_DEFINITION_MAP, canHaveChildren } from '../lib/catalog'
import type { BehaviorNode } from '../types'

export function BehaviorNodeCard({ data, selected }: NodeProps<BehaviorNode>) {
  const definition = NODE_DEFINITION_MAP.get(data.nodeType)
  const Icon = definition?.icon || CircleDot
  const status = data.runtimeStatus || 'IDLE'

  return (
    <div className={`behavior-node category-${data.category} runtime-${status.toLowerCase()} ${selected ? 'is-selected' : ''}`}>
      <Handle className="node-handle node-handle-target" type="target" position={Position.Top} />
      <div className="node-accent" />
      <div className="node-icon"><Icon size={17} strokeWidth={1.9} /></div>
      <div className="node-copy">
        <div className="node-title" title={data.label}>{data.label}</div>
        <div className="node-type">{data.registrationName}</div>
      </div>
      {data.breakpoint && <OctagonAlert className="breakpoint-icon" size={15} aria-label="Breakpoint" />}
      {status !== 'IDLE' && <span className={`runtime-badge runtime-${status.toLowerCase()}`}>{status}</span>}
      {canHaveChildren(data.nodeType) && (
        <Handle className="node-handle node-handle-source" type="source" position={Position.Bottom} />
      )}
    </div>
  )
}
