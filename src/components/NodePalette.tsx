import { Search, SquareFunction, X, Zap } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CATEGORY_LABELS, NODE_DEFINITIONS } from '../lib/catalog'
import type { CustomNodeModel, NodeCategory, NodeType } from '../types'

interface NodePaletteProps {
  customModels: CustomNodeModel[]
  onAddNode: (type: NodeType) => void
  onAddCustomNode: (modelId: string) => void
}

const CATEGORY_ORDER: NodeCategory[] = ['control', 'decorator', 'action', 'condition', 'subtree']

export function NodePalette({ customModels, onAddNode, onAddCustomNode }: NodePaletteProps) {
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLowerCase()
  const groups = useMemo(() => CATEGORY_ORDER.map((category) => ({
    category,
    items: NODE_DEFINITIONS.filter((item) => item.category === category)
      .filter((item) => !normalizedQuery || `${item.label} ${item.description} ${item.type}`.toLowerCase().includes(normalizedQuery)),
  })).filter((group) => group.items.length), [normalizedQuery])

  const visibleModels = useMemo(() => customModels.filter((model) => {
    if (!normalizedQuery) return true
    return `${model.id} ${model.category} ${model.ports.map((port) => port.name).join(' ')}`.toLowerCase().includes(normalizedQuery)
  }), [customModels, normalizedQuery])

  const beginDrag = (event: React.DragEvent, type: NodeType) => {
    event.dataTransfer.setData('application/arborflow-node', type)
    event.dataTransfer.effectAllowed = 'copy'
  }

  const beginCustomDrag = (event: React.DragEvent, modelId: string) => {
    event.dataTransfer.setData('application/arborflow-model', modelId)
    event.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <aside className="left-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">LIBRARY</span>
          <h2>节点</h2>
        </div>
        <span className="count-label">{NODE_DEFINITIONS.length + customModels.length}</span>
      </div>
      <div className="palette-search">
        <Search size={16} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索节点" aria-label="搜索节点" />
        {query && <button className="bare-icon" onClick={() => setQuery('')} title="清除搜索"><X size={15} /></button>}
      </div>
      <div className="palette-scroll">
        {visibleModels.length > 0 && (
          <section className="palette-group custom-model-group">
            <h3>XML 自定义节点</h3>
            <div className="palette-items">
              {visibleModels.map((model) => {
                const Icon = model.category === 'condition' ? SquareFunction : Zap
                return (
                  <button
                    className={`palette-item category-${model.category}`}
                    draggable
                    key={model.id}
                    onDragStart={(event) => beginCustomDrag(event, model.id)}
                    onClick={() => onAddCustomNode(model.id)}
                    title={`${CATEGORY_LABELS[model.category]} · ${model.ports.length} 个端口`}
                  >
                    <span className="palette-item-icon"><Icon size={16} /></span>
                    <span className="palette-item-name">{model.id}</span>
                  </button>
                )
              })}
            </div>
          </section>
        )}
        {groups.map(({ category, items }) => (
          <section className="palette-group" key={category}>
            <h3>{CATEGORY_LABELS[category]}</h3>
            <div className="palette-items">
              {items.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    className={`palette-item category-${category}`}
                    draggable
                    key={item.type}
                    onDragStart={(event) => beginDrag(event, item.type)}
                    onClick={() => onAddNode(item.type)}
                    title={item.description}
                  >
                    <span className="palette-item-icon"><Icon size={16} /></span>
                    <span className="palette-item-name">{item.label}</span>
                  </button>
                )
              })}
            </div>
          </section>
        ))}
        {!groups.length && !visibleModels.length && <div className="panel-empty">没有匹配节点</div>}
      </div>
    </aside>
  )
}
