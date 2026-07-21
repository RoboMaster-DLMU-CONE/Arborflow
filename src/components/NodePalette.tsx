import { Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { CATEGORY_LABELS, NODE_DEFINITIONS } from '../lib/catalog'
import type { NodeCategory, NodeType } from '../types'

interface NodePaletteProps {
  onAddNode: (type: NodeType) => void
}

const CATEGORY_ORDER: NodeCategory[] = ['control', 'decorator', 'action', 'condition', 'subtree']

export function NodePalette({ onAddNode }: NodePaletteProps) {
  const [query, setQuery] = useState('')
  const groups = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return CATEGORY_ORDER.map((category) => ({
      category,
      items: NODE_DEFINITIONS.filter((item) => item.category === category)
        .filter((item) => !normalized || `${item.label} ${item.description} ${item.type}`.toLowerCase().includes(normalized)),
    })).filter((group) => group.items.length)
  }, [query])

  const beginDrag = (event: React.DragEvent, type: NodeType) => {
    event.dataTransfer.setData('application/arborflow-node', type)
    event.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <aside className="left-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">LIBRARY</span>
          <h2>节点</h2>
        </div>
        <span className="count-label">{NODE_DEFINITIONS.length}</span>
      </div>
      <div className="palette-search">
        <Search size={15} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索节点" aria-label="搜索节点" />
        {query && <button className="bare-icon" onClick={() => setQuery('')} title="清除搜索"><X size={14} /></button>}
      </div>
      <div className="palette-scroll">
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
        {!groups.length && <div className="panel-empty">没有匹配节点</div>}
      </div>
    </aside>
  )
}
