import { Handle, Position, type NodeProps } from '@xyflow/react'
import { CircleDot, OctagonAlert } from 'lucide-react'
import { NODE_DEFINITION_MAP, canHaveChildren } from '../lib/catalog'
import { useI18n } from '../context/I18nContext'
import type { BehaviorNode, PortDirection } from '../types'

const MAX_INLINE_PORTS = 5

function getPortDirection(
  portName: string,
  portDirections: Record<string, PortDirection> | undefined,
): PortDirection | null {
  if (!portDirections) return null
  return portDirections[portName] || null
}

export function BehaviorNodeCard({ data, selected }: NodeProps<BehaviorNode>) {
  const definition = NODE_DEFINITION_MAP.get(data.nodeType)
  const Icon = definition?.icon || CircleDot
  const status = data.runtimeStatus || 'IDLE'
  const { lang } = useI18n()

  // Bilingual display: show Chinese as primary when zh, English as secondary
  const isZh = lang === 'zh'
  const primaryLabel = isZh ? (definition?.labelZh || data.label) : data.label
  const secondaryLabel = isZh ? data.label : (definition?.labelZh || '')

  // Port entries for inline display
  const portEntries = Object.entries(data.ports || {})
  const visiblePorts = portEntries.slice(0, MAX_INLINE_PORTS)
  const hiddenCount = portEntries.length - MAX_INLINE_PORTS
  const isRoot = data.nodeType === 'Root'

  return (
    <div className={`behavior-node category-${data.category} runtime-${status.toLowerCase()} ${selected ? 'is-selected' : ''}`}>
      {/* Top handle — skip for Root node since nothing connects above it */}
      {!isRoot && (
        <Handle className="node-handle node-handle-target" type="target" position={Position.Top} />
      )}

      <div className="node-accent" />

      <div className="node-top-row">
        <div className="node-icon"><Icon size={17} strokeWidth={1.9} /></div>
        <div className="node-copy">
          <div className="node-title" title={primaryLabel}>{primaryLabel}</div>
          {secondaryLabel && secondaryLabel !== primaryLabel && (
            <div className="node-subtitle">{secondaryLabel}</div>
          )}
          {!secondaryLabel || secondaryLabel === primaryLabel ? (
            <div className="node-type">{data.registrationName}</div>
          ) : (
            <div className="node-type">{data.registrationName}</div>
          )}
        </div>
      </div>

      {/* Inline port parameters */}
      {portEntries.length > 0 && (
        <div className="node-ports-row">
          {visiblePorts.map(([key, value]) => {
            const dir = getPortDirection(key, data.portDirections)
            return (
              <div className="node-port-param" key={key}>
                {dir && (
                  <span className={`port-dir-badge dir-${dir === 'input' ? 'in' : 'out'}`}>
                    {dir === 'input' ? 'IN' : 'OUT'}
                  </span>
                )}
                <span className="port-key" title={key}>{key}</span>
                {value && <span className="port-value">: {value}</span>}
              </div>
            )
          })}
          {hiddenCount > 0 && (
            <div className="node-ports-more">...+{hiddenCount} more</div>
          )}
        </div>
      )}

      {data.breakpoint && <OctagonAlert className="breakpoint-icon" size={15} aria-label="Breakpoint" />}
      {status !== 'IDLE' && <span className={`runtime-badge runtime-${status.toLowerCase()}`}>{status}</span>}

      {/* Root badge */}
      {isRoot && <span className="runtime-badge" style={{ color: 'var(--amber)', borderColor: 'var(--amber)', bottom: 'auto', top: 6, right: 7 }}>ROOT</span>}

      {/* Bottom handle — only if node can have children */}
      {canHaveChildren(data.nodeType) && (
        <Handle className="node-handle node-handle-source" type="source" position={Position.Bottom} />
      )}
    </div>
  )
}
