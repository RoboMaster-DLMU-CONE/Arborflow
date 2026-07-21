import { AlertCircle, Braces, Plus, Trash2, X } from 'lucide-react'
import { CATEGORY_LABELS } from '../lib/catalog'
import type { BehaviorNode, BehaviorTreeDocument, ValidationIssue } from '../types'

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
  const updatePort = (oldKey: string, key: string, value: string) => {
    if (!selectedNode) return
    const ports = { ...selectedNode.data.ports }
    if (oldKey !== key) delete ports[oldKey]
    ports[key] = value
    onUpdateNode(selectedNode.id, { ports })
  }

  const removePort = (key: string) => {
    if (!selectedNode) return
    const ports = { ...selectedNode.data.ports }
    delete ports[key]
    onUpdateNode(selectedNode.id, { ports })
  }

  const addPort = () => {
    if (!selectedNode) return
    let key = 'port'
    let index = 1
    while (key in selectedNode.data.ports) key = `port_${index++}`
    onUpdateNode(selectedNode.id, { ports: { ...selectedNode.data.ports, [key]: '' } })
  }

  return (
    <aside className="right-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">INSPECTOR</span>
          <h2>{selectedNode ? '节点属性' : '行为树'}</h2>
        </div>
        {selectedNode && <span className={`category-chip category-${selectedNode.data.category}`}>{CATEGORY_LABELS[selectedNode.data.category]}</span>}
      </div>

      <div className="inspector-scroll">
        {selectedNode ? (
          <>
            <div className="field-group">
              <label htmlFor="node-label">显示名称</label>
              <input id="node-label" value={selectedNode.data.label} onChange={(event) => onUpdateNode(selectedNode.id, { label: event.target.value })} />
            </div>
            <div className="field-group">
              <label htmlFor="registration-name">注册名称 / ID</label>
              <input id="registration-name" value={selectedNode.data.registrationName} onChange={(event) => onUpdateNode(selectedNode.id, { registrationName: event.target.value })} />
            </div>
            <div className="field-row">
              <div className="field-group">
                <label>节点类型</label>
                <div className="read-only-value">{selectedNode.data.nodeType}</div>
              </div>
              <div className="field-group">
                <label>运行匹配 ID</label>
                <div className="read-only-value mono" title={selectedNode.id}>{selectedNode.id}</div>
              </div>
            </div>
            <div className="section-divider" />
            <div className="section-title-row">
              <div className="section-title"><Braces size={15} />端口与黑板</div>
              <button className="icon-button compact" onClick={addPort} title="添加端口"><Plus size={15} /></button>
            </div>
            <div className="ports-list">
              {Object.entries(selectedNode.data.ports).map(([key, value]) => (
                <div className="port-row" key={key}>
                  <input className="port-key" value={key} onChange={(event) => updatePort(key, event.target.value, value)} aria-label="端口名" />
                  <input value={value} onChange={(event) => updatePort(key, key, event.target.value)} placeholder="值或 {blackboard}" aria-label={`${key} 的值`} />
                  <button className="bare-icon danger-hover" onClick={() => removePort(key)} title="删除端口"><X size={14} /></button>
                </div>
              ))}
              {!Object.keys(selectedNode.data.ports).length && <div className="inline-empty">暂无端口</div>}
            </div>
            <div className="section-divider" />
            <label className="toggle-row">
              <span><span className="toggle-title">断点</span><span className="toggle-description">运行到此节点时标记</span></span>
              <input type="checkbox" checked={selectedNode.data.breakpoint} onChange={(event) => onUpdateNode(selectedNode.id, { breakpoint: event.target.checked })} />
            </label>
            <div className="field-group notes-field">
              <label htmlFor="node-notes">备注</label>
              <textarea id="node-notes" rows={4} value={selectedNode.data.notes} onChange={(event) => onUpdateNode(selectedNode.id, { notes: event.target.value })} />
            </div>
            <button className="danger-button" onClick={() => onDeleteNode(selectedNode.id)}><Trash2 size={15} />删除节点</button>
          </>
        ) : (
          <>
            <div className="field-group">
              <label htmlFor="tree-title">工程名称</label>
              <input id="tree-title" value={document.title} onChange={(event) => onUpdateDocument({ title: event.target.value })} />
            </div>
            <div className="field-group">
              <label htmlFor="tree-id">主树 ID</label>
              <input id="tree-id" value={document.mainTreeId} onChange={(event) => onUpdateDocument({ mainTreeId: event.target.value })} />
            </div>
            <div className="tree-summary">
              <div><strong>{document.nodes.length}</strong><span>节点</span></div>
              <div><strong>{document.edges.length}</strong><span>连接</span></div>
              <div><strong>{issues.filter((item) => item.severity === 'error').length}</strong><span>错误</span></div>
            </div>
          </>
        )}

        <div className="section-divider" />
        <div className="section-title-row">
          <div className="section-title"><AlertCircle size={15} />结构检查</div>
          <span className="count-label">{issues.length}</span>
        </div>
        <div className="issue-list">
          {!issues.length && <div className="validation-ok">结构有效</div>}
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
