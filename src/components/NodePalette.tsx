import { Plus, Search, SquareFunction, TreePine, X, Zap } from 'lucide-react'
import { useMemo, useState } from 'react'
import { NODE_DEFINITIONS, NODE_DEFINITION_MAP } from '../lib/catalog'
import { useI18n } from '../context/I18nContext'
import type { CustomNodeModel, NodeType } from '../types'

interface NodePaletteProps {
  customModels: CustomNodeModel[]
  onAddNode: (type: NodeType) => void
  onAddCustomNode: (modelId: string) => void
  onAddCustomModel: (model: CustomNodeModel) => void
}

const CATEGORY_ORDER = ['root', 'control', 'decorator', 'action', 'condition', 'subtree'] as const

export function NodePalette({ customModels, onAddNode, onAddCustomNode, onAddCustomModel }: NodePaletteProps) {
  const { t, lang } = useI18n()
  const isZh = lang === 'zh'
  const [query, setQuery] = useState('')
  const normalizedQuery = query.trim().toLowerCase()
  const [creatingModel, setCreatingModel] = useState(false)
  const [newModelName, setNewModelName] = useState('')
  const [newModelType, setNewModelType] = useState<NodeType>('Action')

  const groupedDefinitions = useMemo(() => {
    const defs = NODE_DEFINITIONS.filter((d) => {
      if (!normalizedQuery) return true
      const label = isZh ? d.labelZh : d.label
      const desc = isZh ? d.descriptionZh : d.description
      return `${label} ${desc} ${d.type}`.toLowerCase().includes(normalizedQuery)
    })
    const groups = new Map<string, typeof defs>()
    CATEGORY_ORDER.forEach((cat) => {
      const items = defs.filter((d) => d.category === cat)
      if (items.length) groups.set(cat, items)
    })
    return groups
  }, [normalizedQuery, isZh])

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

  const submitNewModel = () => {
    const trimmed = newModelName.trim()
    if (!trimmed) return
    const def = NODE_DEFINITION_MAP.get(newModelType)!
    const model: CustomNodeModel = {
      id: trimmed,
      nodeType: newModelType,
      category: def.category,
      ports: [],
    }
    if (def.defaultPorts) {
      model.ports = Object.entries(def.defaultPorts).map(([name, defaultValue]) => ({
        name,
        direction: 'input_port' as const,
        type: '',
        defaultValue,
        description: '',
      }))
    }
    onAddCustomModel(model)
    setNewModelName('')
    setNewModelType('Action')
    setCreatingModel(false)
  }

  const catLabel = (cat: string) => {
    return t(`cat.${cat}`)
  }

  const nodeLabel = (d: typeof NODE_DEFINITIONS[number]) => {
    return isZh ? d.labelZh : d.label
  }

  const nodeDesc = (d: typeof NODE_DEFINITIONS[number]) => {
    return isZh ? d.descriptionZh : d.description
  }

  return (
    <aside className="left-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">LIBRARY</span>
          <h2>{t('palette.title')}</h2>
        </div>
        <span className="count-label">{NODE_DEFINITIONS.length + customModels.length}</span>
      </div>
      <div className="palette-search">
        <Search size={16} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('palette.searchPlaceholder')} aria-label={t('palette.searchPlaceholder')} />
        {query && <button className="bare-icon" onClick={() => setQuery('')} title="清除搜索"><X size={15} /></button>}
      </div>
      <div className="palette-scroll">
        {visibleModels.length > 0 && (
          <section className="palette-group custom-model-group">
            <h3>{t('palette.customNodes')}</h3>
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
                    title={`${catLabel(model.category)} · ${model.ports.length} 个端口`}
                  >
                    <span className="palette-item-icon"><Icon size={16} /></span>
                    <span className="palette-item-name">{model.id}</span>
                  </button>
                )
              })}
            </div>
          </section>
        )}
        {creatingModel ? (
          <div className="palette-custom-form">
            <div className="palette-custom-form-row">
              <label>{t('palette.customModelName')}</label>
              <input
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
                placeholder="MyNode"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') submitNewModel(); if (e.key === 'Escape') setCreatingModel(false); }}
              />
            </div>
            <div className="palette-custom-form-row">
              <label>{t('palette.customModelType')}</label>
              <select value={newModelType} onChange={(e) => setNewModelType(e.target.value as NodeType)}>
                {NODE_DEFINITIONS.filter((d) => d.type !== 'Root').map((d) => (
                  <option key={d.type} value={d.type}>{isZh ? d.labelZh : d.label} ({d.type})</option>
                ))}
              </select>
            </div>
            <div className="palette-custom-form-actions">
              <button className="primary-button compact" onClick={submitNewModel}>{t('palette.customModelCreate')}</button>
              <button className="secondary-button compact" onClick={() => setCreatingModel(false)}>{t('modal.cancel')}</button>
            </div>
          </div>
        ) : (
          <button className="palette-add-custom" onClick={() => setCreatingModel(true)}>
            <Plus size={14} /> {t('palette.customModelAdd')}
          </button>
        )}
        {Array.from(groupedDefinitions.entries()).map(([category, items]) => (
          <section className="palette-group" key={category}>
            <h3>{catLabel(category)}</h3>
            <div className="palette-items">
              {items.map((item) => {
                const Icon = item.icon || TreePine
                return (
                  <button
                    className={`palette-item category-${category}`}
                    draggable
                    key={item.type}
                    onDragStart={(event) => beginDrag(event, item.type)}
                    onClick={() => onAddNode(item.type)}
                    title={nodeDesc(item)}
                  >
                    <span className="palette-item-icon"><Icon size={16} /></span>
                    <span className="palette-item-name">{nodeLabel(item)}</span>
                  </button>
                )
              })}
            </div>
          </section>
        ))}
        {!groupedDefinitions.size && !visibleModels.length && <div className="panel-empty">{t('palette.noMatch')}</div>}
      </div>
    </aside>
  )
}
