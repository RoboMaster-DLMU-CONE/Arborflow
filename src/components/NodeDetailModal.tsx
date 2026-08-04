import { Braces, Plus, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { NODE_DEFINITION_MAP } from '../lib/catalog'
import { useI18n } from '../context/I18nContext'
import type { BehaviorNode, PortDirection } from '../types'

interface NodeDetailModalProps {
  node: BehaviorNode
  onSave: (nodeId: string, data: Partial<BehaviorNode['data']>) => void
  onDelete: (nodeId: string) => void
  onClose: () => void
}

export function NodeDetailModal({ node, onSave, onDelete, onClose }: NodeDetailModalProps) {
  const { t, lang } = useI18n()
  const definition = NODE_DEFINITION_MAP.get(node.data.nodeType)

  // Local working copy
  const [label, setLabel] = useState(node.data.label)
  const [registrationName, setRegistrationName] = useState(node.data.registrationName)
  const [ports, setPorts] = useState<Record<string, string>>({ ...node.data.ports })
  const [portDirections, setPortDirections] = useState<Record<string, PortDirection>>(
    node.data.portDirections ? { ...node.data.portDirections } : {},
  )
  const [breakpoint, setBreakpoint] = useState(node.data.breakpoint)
  const [notes, setNotes] = useState(node.data.notes)

  const handleSave = useCallback(() => {
    onSave(node.id, {
      label,
      registrationName,
      ports,
      portDirections: Object.keys(portDirections).length > 0 ? portDirections : undefined,
      breakpoint,
      notes,
    })
    onClose()
  }, [node.id, label, registrationName, ports, portDirections, breakpoint, notes, onSave, onClose])

  const addPort = useCallback(() => {
    let key = 'port'
    let idx = 1
    while (key in ports) key = `port_${idx++}`
    setPorts((prev) => ({ ...prev, [key]: '' }))
  }, [ports])

  const updatePortKey = useCallback((oldKey: string, newKey: string) => {
    setPorts((prev) => {
      const next = { ...prev }
      const value = next[oldKey] || ''
      delete next[oldKey]
      next[newKey] = value
      return next
    })
    setPortDirections((prev) => {
      const next = { ...prev }
      if (oldKey in next) {
        next[newKey] = next[oldKey]
        delete next[oldKey]
      }
      return next
    })
  }, [])

  const updatePortValue = useCallback((key: string, value: string) => {
    setPorts((prev) => ({ ...prev, [key]: value }))
  }, [])

  const updatePortDirection = useCallback((key: string, direction: PortDirection) => {
    setPortDirections((prev) => ({ ...prev, [key]: direction }))
  }, [])

  const removePort = useCallback((key: string) => {
    setPorts((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
    setPortDirections((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const portEntries = Object.entries(ports)

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-card">
        <div className="modal-header">
          <h2>
            <span style={{ color: 'var(--category-color)' }}>
              {lang === 'zh' && definition?.labelZh ? definition.labelZh : definition?.label}
            </span>
            {t('modal.editNode')}
          </h2>
          <button className="bare-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          {/* Basic Info */}
          <div className="field-group">
            <label>{t('inspector.displayName')}</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className="field-group">
            <label>{t('inspector.registrationName')}</label>
            <input value={registrationName} onChange={(e) => setRegistrationName(e.target.value)} />
          </div>
          <div className="field-row">
            <div className="field-group">
              <label>{t('inspector.nodeType')}</label>
              <div className="read-only-value">{node.data.nodeType}</div>
            </div>
            <div className="field-group">
              <label>{t('inspector.nodeId')}</label>
              <div className="read-only-value mono" title={node.id}>{node.id.slice(0, 14)}</div>
            </div>
          </div>

          <div className="section-divider" />

          {/* Ports */}
          <div className="section-title-row">
            <div className="section-title"><Braces size={15} />{t('inspector.ports')}</div>
            <button className="icon-button compact" onClick={addPort} title={t('inspector.addPort')}><Plus size={15} /></button>
          </div>
          <div className="ports-list">
            {portEntries.map(([key, value]) => (
              <div className="port-row" key={key}>
                <input
                  className="port-key"
                  value={key}
                  onChange={(e) => updatePortKey(key, e.target.value)}
                  aria-label={t('inspector.portKey')}
                />
                <select
                  value={portDirections[key] || ''}
                  onChange={(e) => updatePortDirection(key, e.target.value as PortDirection || 'input')}
                  aria-label={t('inspector.portDirection')}
                >
                  <option value="">--</option>
                  <option value="input">IN</option>
                  <option value="output">OUT</option>
                </select>
                <input
                  value={value}
                  onChange={(e) => updatePortValue(key, e.target.value)}
                  placeholder={t('inspector.portValue')}
                  aria-label={`${key} ${t('inspector.portValue')}`}
                />
                <button className="bare-icon danger-hover" onClick={() => removePort(key)} title={t('inspector.deleteNode')}>
                  <X size={14} />
                </button>
              </div>
            ))}
            {!portEntries.length && <div className="inline-empty">{t('inspector.noPorts')}</div>}
          </div>

          <div className="section-divider" />

          {/* Breakpoint */}
          <label className="toggle-row">
            <span>
              <span className="toggle-title">{t('inspector.breakpoint')}</span>
              <span className="toggle-description">{t('inspector.breakpointDesc')}</span>
            </span>
            <input type="checkbox" checked={breakpoint} onChange={(e) => setBreakpoint(e.target.checked)} />
          </label>

          {/* Notes */}
          <div className="field-group notes-field">
            <label>{t('inspector.notes')}</label>
            <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <div className="modal-footer">
          <div className="footer-left">
            <button className="danger-button" onClick={() => { onDelete(node.id); onClose() }}>
              <Trash2 size={15} />{t('modal.delete')}
            </button>
          </div>
          <div className="footer-right">
            <button className="secondary-button" onClick={onClose}>{t('modal.cancel')}</button>
            <button className="primary-button" onClick={handleSave}>{t('modal.save')}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
