import { AlertCircle, Braces, Plus, Trash2, X } from 'lucide-react'
import { useI18n } from '../context/I18nContext'
import type { BehaviorNode, BehaviorTreeDocument, PortDirection, ValidationIssue } from '../types'

interface InspectorProps {
  document: BehaviorTreeDocument
  selectedNode: BehaviorNode | null
  issues: ValidationIssue[]
  onUpdateDocument: (patch: Partial<Pick<BehaviorTreeDocument, 'title' | 'mainTreeId'>>) => void
  onUpdateNode: (nodeId: string, data: Partial<BehaviorNode['data']>) => void
  onDeleteNode: (nodeId: string) => void
  onSelectIssue: (nodeId: string) => void
}

export function Inspector({ document, selectedNode, issues, onUpdateDocument, onUpdateNode, onDeleteNode, onSelectIssue }: InspectorProps) {
  const { t } = useI18n()

  const updatePort = (oldKey: string, key: string, value: string) => {
    if (!selectedNode) return
    const ports = { ...selectedNode.data.ports }
    if (oldKey !== key) delete ports[oldKey]
    ports[key] = value
    onUpdateNode(selectedNode.id, { ports })
  }

  const updatePortDirection = (key: string, direction: PortDirection | '') => {
    if (!selectedNode) return
    const portDirections = { ...(selectedNode.data.portDirections || {}) }
    if (direction) {
      portDirections[key] = direction
    } else {
      delete portDirections[key]
    }
    onUpdateNode(selectedNode.id, { portDirections: Object.keys(portDirections).length > 0 ? portDirections : undefined })
  }

  const removePort = (key: string) => {
    if (!selectedNode) return
    const ports = { ...selectedNode.data.ports }
    delete ports[key]
    const portDirections = selectedNode.data.portDirections ? { ...selectedNode.data.portDirections } : {}
    delete portDirections[key]
    onUpdateNode(selectedNode.id, {
      ports,
      portDirections: Object.keys(portDirections).length > 0 ? portDirections : undefined,
    })
  }

  const addPort = () => {
    if (!selectedNode) return
    let key = 'port'
    let index = 1
    while (key in selectedNode.data.ports) key = `port_${index++}`
    onUpdateNode(selectedNode.id, { ports: { ...selectedNode.data.ports, [key]: '' } })
  }

  const getPortDir = (key: string): PortDirection | '' => {
    if (!selectedNode?.data.portDirections) return ''
    return selectedNode.data.portDirections[key] || ''
  }

  return (
    <aside className="right-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">{t('inspector.title')}</span>
          <h2>{selectedNode ? t('inspector.nodeProps') : t('inspector.treeProps')}</h2>
        </div>
        {selectedNode && (
          <span className={`category-chip category-${selectedNode.data.category}`}>
            {t(`cat.${selectedNode.data.category}`)}
          </span>
        )}
      </div>

      <div className="inspector-scroll">
        {selectedNode ? (
          <>
            <div className="field-group">
              <label htmlFor="node-label">{t('inspector.displayName')}</label>
              <input id="node-label" value={selectedNode.data.label} onChange={(event) => onUpdateNode(selectedNode.id, { label: event.target.value })} />
            </div>
            <div className="field-group">
              <label htmlFor="registration-name">{t('inspector.registrationName')}</label>
              <input id="registration-name" value={selectedNode.data.registrationName} onChange={(event) => onUpdateNode(selectedNode.id, { registrationName: event.target.value })} />
            </div>
            <div className="field-row">
              <div className="field-group">
                <label>{t('inspector.nodeType')}</label>
                <div className="read-only-value">{selectedNode.data.nodeType}</div>
              </div>
              <div className="field-group">
                <label>{t('inspector.nodeId')}</label>
                <div className="read-only-value mono" title={selectedNode.id}>{selectedNode.id}</div>
              </div>
            </div>
            <div className="section-divider" />
            <div className="section-title-row">
              <div className="section-title"><Braces size={15} />{t('inspector.ports')}</div>
              <button className="icon-button compact" onClick={addPort} title={t('inspector.addPort')}><Plus size={15} /></button>
            </div>
            <div className="ports-list">
              {Object.entries(selectedNode.data.ports).map(([key, value]) => (
                <div className="port-row" key={key}>
                  <input className="port-key" value={key} onChange={(event) => updatePort(key, event.target.value, value)} aria-label={t('inspector.portKey')} />
                  <select
                    value={getPortDir(key)}
                    onChange={(event) => updatePortDirection(key, event.target.value as PortDirection | '')}
                    style={{ gridColumn: '1', gridRow: '2', height: 22, fontSize: 9, border: '1px solid var(--border-input)', borderRadius: 4, color: 'var(--text-primary)', background: 'var(--bg-input)' }}
                  >
                    <option value="">--</option>
                    <option value="input">IN</option>
                    <option value="output">OUT</option>
                  </select>
                  <input value={value} onChange={(event) => updatePort(key, key, event.target.value)} placeholder={t('inspector.portValue')} aria-label={`${key} ${t('inspector.portValue')}`} />
                  <button className="bare-icon danger-hover" onClick={() => removePort(key)} title={t('inspector.deleteNode')}><X size={14} /></button>
                </div>
              ))}
              {!Object.keys(selectedNode.data.ports).length && <div className="inline-empty">{t('inspector.noPorts')}</div>}
            </div>
            <div className="section-divider" />
            <label className="toggle-row">
              <span><span className="toggle-title">{t('inspector.breakpoint')}</span><span className="toggle-description">{t('inspector.breakpointDesc')}</span></span>
              <input type="checkbox" checked={selectedNode.data.breakpoint} onChange={(event) => onUpdateNode(selectedNode.id, { breakpoint: event.target.checked })} />
            </label>
            <div className="field-group notes-field">
              <label htmlFor="node-notes">{t('inspector.notes')}</label>
              <textarea id="node-notes" rows={4} value={selectedNode.data.notes} onChange={(event) => onUpdateNode(selectedNode.id, { notes: event.target.value })} />
            </div>
            <button className="danger-button" onClick={() => onDeleteNode(selectedNode.id)}><Trash2 size={15} />{t('inspector.deleteNode')}</button>
          </>
        ) : (
          <>
            <div className="field-group">
              <label htmlFor="tree-title">{t('inspector.projectName')}</label>
              <input id="tree-title" value={document.title} onChange={(event) => onUpdateDocument({ title: event.target.value })} />
            </div>
            <div className="field-group">
              <label htmlFor="tree-id">{t('inspector.mainTreeId')}</label>
              <input id="tree-id" value={document.mainTreeId} onChange={(event) => onUpdateDocument({ mainTreeId: event.target.value })} />
            </div>
            <div className="tree-summary">
              <div><strong>{document.nodes.length}</strong><span>{t('inspector.nodeCount')}</span></div>
              <div><strong>{document.edges.length}</strong><span>{t('inspector.edgeCount')}</span></div>
              <div><strong>{issues.filter((item) => item.severity === 'error').length}</strong><span>{t('inspector.errorCount')}</span></div>
            </div>
          </>
        )}

        <div className="section-divider" />
        <div className="section-title-row">
          <div className="section-title"><AlertCircle size={15} />{t('inspector.structureCheck')}</div>
          <span className="count-label">{issues.length}</span>
        </div>
        <div className="issue-list">
          {!issues.length && <div className="validation-ok">{t('validation.valid')}</div>}
          {issues.map((issue, index) => (
            <button key={`${issue.message}-${index}`} className={`issue-row ${issue.severity}`} onClick={() => issue.nodeId && onSelectIssue(issue.nodeId)} disabled={!issue.nodeId}>
              <span className="issue-dot" />
              <span>{issue.message}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}
