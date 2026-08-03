import {
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  applyNodeChanges,
  useReactFlow,
  type Connection,
  type NodeChange,
  type OnConnect,
} from '@xyflow/react'
import {
  Activity,
  AlignVerticalSpaceAround,
  Check,
  ChevronDown,
  Code2,
  Copy,
  FileCode2,
  FileDown,
  FilePlus2,
  FolderOpen,
  GitBranch,
  MonitorDot,
  Moon,
  Redo2,
  Save,
  Settings,
  Sun,
  TreePine,
  Undo2,
  Upload,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BehaviorNodeCard } from './components/BehaviorNodeCard'
import { Inspector } from './components/Inspector'
import { MonitorPanel } from './components/MonitorPanel'
import { NodeDetailModal } from './components/NodeDetailModal'
import { NodePalette } from './components/NodePalette'
import { createNode, createNodeFromModel, maxChildren } from './lib/catalog'
import { createDemoDocument, createEmptyDocument } from './lib/demo'
import { layoutDocument } from './lib/layout'
import { downloadText, parseProject, pickBrowserFile, serializeProject } from './lib/project'
import { activeTreeId, switchDocumentTree, syncedTreeGraphs } from './lib/trees'
import { validateDocument, wouldCreateCycle } from './lib/validation'
import { documentToXml, xmlToDocument } from './lib/xml'
import { useTheme } from './context/ThemeContext'
import { useI18n } from './context/I18nContext'
import type { BehaviorNode, BehaviorTreeDocument, CustomNodeModel, NodeType, RuntimeStatus } from './types'

const nodeTypes = { behavior: BehaviorNodeCard }
const PROJECT_FILTERS = [{ name: 'ArborFlow Project', extensions: ['arborflow', 'json'] }]
const XML_FILTERS = [{ name: 'BehaviorTree.CPP XML', extensions: ['xml'] }]

type ViewMode = 'canvas' | 'xml'
type DocumentUpdater = BehaviorTreeDocument | ((current: BehaviorTreeDocument) => BehaviorTreeDocument)

function Editor() {
  const { theme, toggleTheme } = useTheme()
  const { t, lang, setLang } = useI18n()
  const [treeDocument, setTreeDocument] = useState<BehaviorTreeDocument>(() => createDemoDocument())
  const [projectPath, setProjectPath] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('canvas')
  const [treeMenuOpen, setTreeMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [monitorOpen, setMonitorOpen] = useState(false)
  const [modalNodeId, setModalNodeId] = useState<string | null>(null)
  const [runtimeStatuses, setRuntimeStatuses] = useState<Record<string, RuntimeStatus>>({})
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)
  const [historyRevision, setHistoryRevision] = useState(0)
  const [zoom, setZoom] = useState(100)
  const savedContentRef = useRef(serializeProject(treeDocument))
  const pastRef = useRef<BehaviorTreeDocument[]>([])
  const futureRef = useRef<BehaviorTreeDocument[]>([])
  const dragStartRef = useRef<BehaviorTreeDocument | null>(null)
  const { fitView, screenToFlowPosition, setCenter } = useReactFlow()

  const selectedNode = useMemo(
    () => treeDocument.nodes.find((node) => node.id === selectedNodeId) || null,
    [treeDocument.nodes, selectedNodeId],
  )
  const treeGraphs = useMemo(() => syncedTreeGraphs(treeDocument), [treeDocument])
  const currentTreeId = activeTreeId(treeDocument)
  const issues = useMemo(() => validateDocument(treeDocument), [treeDocument])

  const xmlPreview = useMemo(() => {
    try {
      return { value: documentToXml(treeDocument), error: '' }
    } catch (error) {
      return { value: '', error: error instanceof Error ? error.message : '无法生成 XML' }
    }
  }, [treeDocument])

  const showToast = useCallback((message: string, kind: 'success' | 'error' = 'success') => {
    setToast({ message, kind })
    window.setTimeout(() => setToast(null), 2600)
  }, [])

  const commit = useCallback((updater: DocumentUpdater) => {
    setTreeDocument((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater
      if (next === current) return current
      pastRef.current = [...pastRef.current.slice(-79), current]
      futureRef.current = []
      setHistoryRevision((value) => value + 1)
      setDirty(serializeProject(next) !== savedContentRef.current)
      return next
    })
  }, [])

  const replaceDocument = useCallback((next: BehaviorTreeDocument, path: string | null = null) => {
    setTreeDocument(next)
    setProjectPath(path)
    setSelectedNodeId(null)
    setSelectedEdgeId(null)
    setRuntimeStatuses({})
    setDirty(false)
    savedContentRef.current = serializeProject(next)
    pastRef.current = []
    futureRef.current = []
    setHistoryRevision((value) => value + 1)
    window.setTimeout(() => fitView({ padding: 0.18, duration: 350 }), 60)
  }, [fitView])

  const undo = useCallback(() => {
    const previous = pastRef.current.at(-1)
    if (!previous) return
    setTreeDocument((current) => {
      futureRef.current = [current, ...futureRef.current]
      return previous
    })
    pastRef.current = pastRef.current.slice(0, -1)
    setSelectedNodeId(null)
    setDirty(serializeProject(previous) !== savedContentRef.current)
    setHistoryRevision((value) => value + 1)
  }, [])

  const redo = useCallback(() => {
    const next = futureRef.current[0]
    if (!next) return
    setTreeDocument((current) => {
      pastRef.current = [...pastRef.current, current]
      return next
    })
    futureRef.current = futureRef.current.slice(1)
    setSelectedNodeId(null)
    setDirty(serializeProject(next) !== savedContentRef.current)
    setHistoryRevision((value) => value + 1)
  }, [])

  const addNodeAt = useCallback((type: NodeType, position?: { x: number; y: number }) => {
    const point = position || screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
    const node = createNode(type, point)
    commit((current) => ({ ...current, nodes: [...current.nodes, node] }))
    setSelectedNodeId(node.id)
    setViewMode('canvas')
  }, [commit, screenToFlowPosition])

  const addCustomNodeAt = useCallback((modelId: string, position?: { x: number; y: number }) => {
    const model = treeDocument.nodeModels?.find((item) => item.id === modelId)
    if (!model) return
    const point = position || screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
    const node = createNodeFromModel(model, point)
    commit((current) => ({ ...current, nodes: [...current.nodes, node] }))
    setSelectedNodeId(node.id)
    setViewMode('canvas')
  }, [commit, screenToFlowPosition, treeDocument.nodeModels])

  const addCustomModel = useCallback((model: CustomNodeModel) => {
    commit((current) => ({
      ...current,
      nodeModels: [...(current.nodeModels || []), model],
    }))
  }, [commit])

  const switchTree = useCallback((treeId: string) => {
    if (treeId === currentTreeId) {
      setTreeMenuOpen(false)
      return
    }
    setTreeDocument((current) => switchDocumentTree(current, treeId))
    setSelectedNodeId(null)
    setSelectedEdgeId(null)
    setRuntimeStatuses({})
    setTreeMenuOpen(false)
    pastRef.current = []
    futureRef.current = []
    setHistoryRevision((value) => value + 1)
    window.setTimeout(() => fitView({ padding: 0.2, duration: 320 }), 60)
  }, [currentTreeId, fitView])

  const deleteNode = useCallback((nodeId: string) => {
    commit((current) => ({
      ...current,
      nodes: current.nodes.filter((node) => node.id !== nodeId),
      edges: current.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
    }))
    setSelectedNodeId(null)
  }, [commit])

  const deleteEdge = useCallback((edgeId: string) => {
    commit((current) => ({ ...current, edges: current.edges.filter((edge) => edge.id !== edgeId) }))
    setSelectedEdgeId(null)
  }, [commit])

  const updateNode = useCallback((nodeId: string, data: Partial<BehaviorNode['data']>) => {
    commit((current) => ({
      ...current,
      nodes: current.nodes.map((node) => node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node),
    }))
  }, [commit])

  const onNodesChange = useCallback((changes: NodeChange<BehaviorNode>[]) => {
    setTreeDocument((current) => ({ ...current, nodes: applyNodeChanges(changes, current.nodes) }))
  }, [])

  const connectNodes: OnConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return
    const source = treeDocument.nodes.find((node) => node.id === connection.source)
    if (!source) return
    const outgoingCount = treeDocument.edges.filter((edge) => edge.source === source.id).length
    const incomingCount = treeDocument.edges.filter((edge) => edge.target === connection.target).length
    if (outgoingCount >= maxChildren(source.data.nodeType)) {
      showToast(`${source.data.label} 不能再添加子节点`, 'error')
      return
    }
    if (incomingCount > 0) {
      showToast('一个节点只能有一个父节点', 'error')
      return
    }
    if (wouldCreateCycle(treeDocument, connection.source, connection.target)) {
      showToast('此连接会形成环路', 'error')
      return
    }
    commit((current) => ({
      ...current,
      edges: addEdge({ ...connection, id: `edge_${crypto.randomUUID().slice(0, 8)}`, type: 'smoothstep' }, current.edges),
    }))
  }, [commit, showToast, treeDocument])

  const autoLayout = useCallback(() => {
    if (!treeDocument.nodes.length) return
    commit((current) => layoutDocument(current))
    window.setTimeout(() => fitView({ padding: 0.2, duration: 420 }), 50)
  }, [commit, fitView, treeDocument.nodes.length])

  const newProject = useCallback(() => {
    if (dirty && !window.confirm('当前工程有未保存更改，仍要新建吗？')) return
    replaceDocument(createEmptyDocument())
  }, [dirty, replaceDocument])

  const openProject = useCallback(async () => {
    try {
      const result = window.arborflow
        ? await window.arborflow.openText({ filters: PROJECT_FILTERS })
        : await pickBrowserFile('.arborflow,.json')
      if (!result) return
      replaceDocument(parseProject(result.content), window.arborflow ? result.path : null)
      showToast('工程已打开')
    } catch (error) {
      showToast(error instanceof Error ? error.message : '打开工程失败', 'error')
    }
  }, [replaceDocument, showToast])

  const saveProject = useCallback(async (prompt = false) => {
    try {
      const content = serializeProject(treeDocument)
      if (!window.arborflow) {
        downloadText(`${treeDocument.title || 'behavior-tree'}.arborflow`, content, 'application/json')
        savedContentRef.current = content
        setDirty(false)
        showToast('工程已下载')
        return
      }
      const result = await window.arborflow.saveText({
        path: prompt ? undefined : projectPath || undefined,
        prompt: prompt || !projectPath,
        defaultPath: projectPath || `${treeDocument.title || 'behavior-tree'}.arborflow`,
        content,
        filters: PROJECT_FILTERS,
      })
      if (!result) return
      setProjectPath(result.path)
      savedContentRef.current = content
      setDirty(false)
      showToast('工程已保存')
    } catch (error) {
      showToast(error instanceof Error ? error.message : '保存失败', 'error')
    }
  }, [projectPath, showToast, treeDocument])

  const importXml = useCallback(async () => {
    try {
      const result = window.arborflow
        ? await window.arborflow.openText({ filters: XML_FILTERS })
        : await pickBrowserFile('.xml')
      if (!result) return
      replaceDocument(xmlToDocument(result.content))
      savedContentRef.current = ''
      setDirty(true)
      showToast('XML 已导入')
    } catch (error) {
      showToast(error instanceof Error ? error.message : '导入 XML 失败', 'error')
    }
  }, [replaceDocument, showToast])

  const exportXml = useCallback(async () => {
    try {
      const content = documentToXml(treeDocument)
      const filename = `${treeDocument.mainTreeId || 'MainTree'}.xml`
      if (!window.arborflow) {
        downloadText(filename, content, 'application/xml')
      } else {
        const result = await window.arborflow.saveText({ prompt: true, defaultPath: filename, content, filters: XML_FILTERS })
        if (!result) return
      }
      showToast('BehaviorTree.CPP XML 已导出')
    } catch (error) {
      showToast(error instanceof Error ? error.message : '导出 XML 失败', 'error')
    }
  }, [showToast, treeDocument])

  const selectAndRevealNode = useCallback((nodeId: string) => {
    const node = treeDocument.nodes.find((item) => item.id === nodeId)
    if (!node) return
    setSelectedNodeId(nodeId)
    setViewMode('canvas')
    setCenter(node.position.x + 105, node.position.y + 42, { zoom: 1.15, duration: 350 })
  }, [setCenter, treeDocument.nodes])

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    const modelId = event.dataTransfer.getData('application/arborflow-model')
    if (modelId) {
      addCustomNodeAt(modelId, screenToFlowPosition({ x: event.clientX, y: event.clientY }))
      return
    }
    const type = event.dataTransfer.getData('application/arborflow-node') as NodeType
    if (!type) return
    addNodeAt(type, screenToFlowPosition({ x: event.clientX, y: event.clientY }))
  }, [addCustomNodeAt, addNodeAt, screenToFlowPosition])

  const copyXml = useCallback(async () => {
    if (!xmlPreview.value) return
    await navigator.clipboard.writeText(xmlPreview.value)
    showToast('XML 已复制')
  }, [showToast, xmlPreview.value])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) return
      const command = event.ctrlKey || event.metaKey
      if (command && event.key.toLowerCase() === 'z') {
        event.preventDefault()
        event.shiftKey ? redo() : undo()
      } else if (command && event.key.toLowerCase() === 's') {
        event.preventDefault()
        void saveProject(event.shiftKey)
      } else if (command && event.key.toLowerCase() === 'o') {
        event.preventDefault()
        void openProject()
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedNodeId) deleteNode(selectedNodeId)
        else if (selectedEdgeId) deleteEdge(selectedEdgeId)
      } else if (event.key.toLowerCase() === 'f') {
        fitView({ padding: 0.2, duration: 300 })
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [deleteEdge, deleteNode, fitView, openProject, redo, saveProject, selectedEdgeId, selectedNodeId, undo])

  useEffect(() => {
    if (!window.arborflow) return
    return window.arborflow.onMenuCommand((command) => {
      if (command === 'new') newProject()
      if (command === 'open') void openProject()
      if (command === 'save') void saveProject(false)
      if (command === 'save-as') void saveProject(true)
      if (command === 'import-xml') void importXml()
      if (command === 'export-xml') void exportXml()
      if (command === 'undo') undo()
      if (command === 'redo') redo()
      if (command === 'layout') autoLayout()
      if (command === 'fit') fitView({ padding: 0.2, duration: 300 })
    })
  }, [autoLayout, exportXml, fitView, importXml, newProject, openProject, redo, saveProject, undo])

  useEffect(() => {
    document.title = `${dirty ? '● ' : ''}${treeDocument.title} — ArborFlow`
  }, [dirty, treeDocument.title])

  useEffect(() => {
    const timer = window.setTimeout(() => fitView({ padding: monitorOpen ? 0.25 : 0.2, duration: 280 }), 80)
    return () => window.clearTimeout(timer)
  }, [fitView, monitorOpen])

  useEffect(() => {
    let timer: number | undefined
    const handleResize = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => fitView({ padding: monitorOpen ? 0.25 : 0.2, duration: 220 }), 140)
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('resize', handleResize)
    }
  }, [fitView, monitorOpen])

  const renderedNodes = useMemo(() => treeDocument.nodes.map((node) => ({
    ...node,
    selected: node.id === selectedNodeId,
    data: { ...node.data, runtimeStatus: runtimeStatuses[node.id] || 'IDLE' as RuntimeStatus },
  })), [runtimeStatuses, selectedNodeId, treeDocument.nodes])

  const renderedEdges = useMemo(() => treeDocument.edges.map((edge) => ({
    ...edge,
    selected: edge.id === selectedEdgeId,
    animated: runtimeStatuses[edge.source] === 'RUNNING',
    markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
  })), [runtimeStatuses, selectedEdgeId, treeDocument.edges])

  const applyRuntimeStatus = useCallback((nodeIds: string[], status: RuntimeStatus) => {
    if (!nodeIds.length) return
    setRuntimeStatuses((current) => {
      const next = { ...current }
      nodeIds.forEach((id) => { next[id] = status })
      return next
    })
  }, [])

  const errors = issues.filter((issue) => issue.severity === 'error').length
  const canUndo = useMemo(() => pastRef.current.length > 0, [historyRevision])
  const canRedo = useMemo(() => futureRef.current.length > 0, [historyRevision])

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-block">
          <div className="brand-mark"><TreePine size={20} /></div>
          <div className="brand-copy"><strong>ArborFlow</strong><span>Behavior Tree Studio</span></div>
        </div>
        <div className="document-title"><span>{treeDocument.title}</span>{dirty && <i title="未保存" />}</div>
        <div className="header-actions">
          <button className="icon-button" onClick={newProject} title="新建工程 (Ctrl+N)"><FilePlus2 size={17} /></button>
          <button className="icon-button" onClick={() => void openProject()} title="打开工程 (Ctrl+O)"><FolderOpen size={17} /></button>
          <button className="icon-button" onClick={() => void saveProject(false)} title="保存工程 (Ctrl+S)"><Save size={17} /></button>
          <span className="toolbar-separator" />
          <button className="icon-button" onClick={undo} disabled={!canUndo} title="撤销 (Ctrl+Z)"><Undo2 size={17} /></button>
          <button className="icon-button" onClick={redo} disabled={!canRedo} title="重做 (Ctrl+Shift+Z)"><Redo2 size={17} /></button>
          <span className="toolbar-separator" />
          <button className="icon-button" onClick={importXml} title="导入 XML"><Upload size={17} /></button>
          <button className="icon-button" onClick={exportXml} title="导出 XML"><FileDown size={17} /></button>
          <span className="toolbar-separator" />
          <button className={`icon-button ${settingsOpen ? 'active' : ''}`} onClick={() => setSettingsOpen((v) => !v)} title="设置"><Settings size={17} /></button>
          <button className={`monitor-button ${monitorOpen ? 'active' : ''}`} onClick={() => setMonitorOpen((value) => !value)}><MonitorDot size={16} />Monitor</button>
        </div>
      </header>

      {settingsOpen && (
        <div className="settings-dropdown">
          <div className="settings-heading">{t('settings.title')}</div>
          <div className="settings-heading" style={{ marginTop: 4 }}>{t('settings.theme')}</div>
          <button className="settings-row" onClick={toggleTheme}>
            <span>{theme === 'dark' ? <><Moon size={14} /> {t('settings.dark')}</> : <><Sun size={14} /> {t('settings.light')}</>}</span>
            <small>{theme === 'dark' ? 'Dark' : 'Light'}</small>
          </button>
          <div className="settings-heading" style={{ marginTop: 4 }}>{t('settings.language')}</div>
          <button className={`settings-row ${lang === 'zh' ? 'active' : ''}`} onClick={() => setLang('zh')}>
            <span>{t('settings.langZh')}</span>
            {lang === 'zh' && <small>✓</small>}
          </button>
          <button className={`settings-row ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>
            <span>{t('settings.langEn')}</span>
            {lang === 'en' && <small>✓</small>}
          </button>
        </div>
      )}

      <div className="workspace-toolbar">
        <div className="tree-selector">
          <button className={`tree-tab ${treeMenuOpen ? 'active' : ''}`} onClick={() => setTreeMenuOpen((value) => !value)}>
            <GitBranch size={15} /><span>{currentTreeId}</span><ChevronDown size={13} />
          </button>
          {treeMenuOpen && (
            <div className="tree-menu">
              <div className="tree-menu-heading">行为树 · {treeGraphs.length}</div>
              {treeGraphs.map((tree) => (
                <button className={tree.id === currentTreeId ? 'active' : ''} key={tree.id} onClick={() => switchTree(tree.id)}>
                  <span>{tree.id}</span>
                  <small>{tree.nodes.length} 节点{tree.id === treeDocument.mainTreeId ? ' · MAIN' : ''}</small>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="view-switch" aria-label="视图切换">
          <button className={viewMode === 'canvas' ? 'active' : ''} onClick={() => setViewMode('canvas')}><TreePine size={14} />画布</button>
          <button className={viewMode === 'xml' ? 'active' : ''} onClick={() => setViewMode('xml')}><Code2 size={14} />XML</button>
        </div>
        <div className="workspace-toolbar-actions">
          <button className="tool-button" onClick={autoLayout} title="自动布局 (Ctrl+L)"><AlignVerticalSpaceAround size={15} />自动布局</button>
        </div>
      </div>

      <main className="workspace-grid">
        <NodePalette customModels={treeDocument.nodeModels || []} onAddNode={addNodeAt} onAddCustomNode={addCustomNodeAt} onAddCustomModel={addCustomModel} />
        <section className="center-stage">
          <div className="canvas-region" onDragOver={(event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'copy' }} onDrop={handleDrop}>
            {viewMode === 'canvas' ? (
              <ReactFlow
                nodes={renderedNodes}
                edges={renderedEdges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onConnect={connectNodes}
                onNodeClick={(_event, node) => { setSelectedNodeId(node.id); setSelectedEdgeId(null) }}
                onNodeDoubleClick={(_event, node) => { setModalNodeId(node.id); setSelectedNodeId(node.id) }}
                onEdgeClick={(_event, edge) => { setSelectedEdgeId(edge.id); setSelectedNodeId(null) }}
                onPaneClick={() => { setSelectedNodeId(null); setSelectedEdgeId(null); setTreeMenuOpen(false); setSettingsOpen(false) }}
                onNodeDragStart={() => { dragStartRef.current = treeDocument }}
                onNodeDragStop={() => {
                  if (dragStartRef.current) {
                    pastRef.current = [...pastRef.current.slice(-79), dragStartRef.current]
                    futureRef.current = []
                    dragStartRef.current = null
                    setDirty(true)
                    setHistoryRevision((value) => value + 1)
                  }
                }}
                onMoveEnd={(_event, viewport) => setZoom(Math.round(viewport.zoom * 100))}
                deleteKeyCode={null}
                snapToGrid
                snapGrid={[12, 12]}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.2}
                maxZoom={2.2}
                defaultEdgeOptions={{ type: 'smoothstep' }}
                proOptions={{ hideAttribution: true }}
              >
                <Background variant={BackgroundVariant.Dots} gap={22} size={1.2} color={theme === 'dark' ? '#343a40' : '#c4c8ce'} />
                <Controls showInteractive={false} position="bottom-left" />
                <MiniMap
                  position="bottom-right"
                  pannable
                  zoomable
                  nodeColor={(node) => {
                    const category = (node.data as BehaviorNode['data']).category
                    const colors = theme === 'dark'
                      ? { control: '#4f8cff', decorator: '#c084fc', action: '#22c98b', condition: '#f2b84b', subtree: '#ec6f66', root: '#eeb84a' }
                      : { control: '#3a72e0', decorator: '#8b5fd4', action: '#1aad6f', condition: '#d99a20', subtree: '#d9605a', root: '#d99a20' }
                    return colors[category] || (theme === 'dark' ? '#68717b' : '#929aa3')
                  }}
                  maskColor={theme === 'dark' ? 'rgba(10, 12, 15, 0.72)' : 'rgba(200, 205, 212, 0.45)'}
                />
              </ReactFlow>
            ) : (
              <div className="xml-view">
                <div className="xml-header">
                  <div><FileCode2 size={16} /><span>{treeDocument.mainTreeId}.xml</span></div>
                  <button className="icon-button compact" onClick={copyXml} disabled={!xmlPreview.value} title="复制 XML"><Copy size={15} /></button>
                </div>
                {xmlPreview.error ? (
                  <div className="xml-error"><Activity size={20} /><strong>无法生成 XML</strong><span>{xmlPreview.error}</span></div>
                ) : (
                  <pre><code>{xmlPreview.value}</code></pre>
                )}
              </div>
            )}
          </div>
          <MonitorPanel
            open={monitorOpen}
            nodes={treeDocument.nodes}
            onClose={() => setMonitorOpen(false)}
            onRuntimeUpdate={applyRuntimeStatus}
            onClearStatuses={() => setRuntimeStatuses({})}
          />
        </section>
        <Inspector
          document={treeDocument}
          selectedNode={selectedNode}
          issues={issues}
          onUpdateDocument={(patch) => commit((current) => ({ ...current, ...patch }))}
          onUpdateNode={updateNode}
          onDeleteNode={deleteNode}
          onSelectIssue={selectAndRevealNode}
        />
      </main>

      <footer className="status-bar">
        <div><span className={errors ? 'status-error' : 'status-valid'}>{errors ? `${errors} 个结构错误` : <><Check size={12} />结构有效</>}</span></div>
        <div><span>{treeGraphs.length} 棵树</span><span>{treeDocument.nodes.length} 节点</span><span>{treeDocument.edges.length} 连接</span><span>{zoom}%</span><span>{window.arborflow ? `Desktop · ${window.arborflow.platform}` : 'Web Preview'}</span></div>
      </footer>
      {toast && <div className={`toast ${toast.kind}`}>{toast.message}</div>}

      {modalNodeId && (() => {
        const modalNode = treeDocument.nodes.find((n) => n.id === modalNodeId)
        if (!modalNode) return null
        return (
          <NodeDetailModal
            node={modalNode}
            onSave={updateNode}
            onDelete={(nodeId) => { deleteNode(nodeId); setModalNodeId(null) }}
            onClose={() => setModalNodeId(null)}
          />
        )
      })()}
    </div>
  )
}

export default function App() {
  return <ReactFlowProvider><Editor /></ReactFlowProvider>
}
