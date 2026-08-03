import { createNode, NODE_DEFINITION_MAP } from './catalog'
import { layoutGraph } from './layout'
import { syncedTreeGraphs } from './trees'
import type {
  BehaviorEdge,
  BehaviorNode,
  BehaviorTreeDocument,
  BehaviorTreeGraph,
  CustomNodeModel,
  NodeCategory,
  NodePortModel,
  NodeType,
} from '../types'

const CONTROL_AND_DECORATOR_TYPES = new Set<NodeType>([
  'Sequence', 'Fallback', 'Parallel', 'ReactiveSequence', 'ReactiveFallback',
  'Inverter', 'RetryUntilSuccessful', 'Repeat', 'ForceSuccess', 'ForceFailure',
])

const PORT_TAGS = new Set<NodePortModel['direction']>(['input_port', 'output_port', 'inout_port'])

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function nodeTag(node: BehaviorNode) {
  if (node.data.xmlTag) return node.data.xmlTag
  if (node.data.nodeType === 'SubTree') return 'SubTree'
  if (node.data.nodeType === 'Action') return 'Action'
  if (node.data.nodeType === 'Condition') return 'Condition'
  return node.data.nodeType
}

function renderTree(graph: BehaviorTreeGraph) {
  if (graph.nodes.length === 0) throw new Error(`${graph.id} 画布为空，无法导出 XML`)
  const incoming = new Map(graph.nodes.map((node) => [node.id, 0]))
  graph.edges.forEach((edge) => incoming.set(edge.target, (incoming.get(edge.target) || 0) + 1))
  const roots = graph.nodes.filter((node) => (incoming.get(node.id) || 0) === 0)
  if (roots.length !== 1) throw new Error(`${graph.id} 必须只有一个根节点，当前检测到 ${roots.length} 个`)

  const byId = new Map(graph.nodes.map((node) => [node.id, node]))
  const children = new Map<string, BehaviorNode[]>()
  graph.edges.forEach((edge) => {
    const child = byId.get(edge.target)
    if (child) children.set(edge.source, [...(children.get(edge.source) || []), child])
  })
  children.forEach((items) => items.sort((a, b) => a.position.x - b.position.x))

  // Skip Root nodes — their children become the XML root(s)
  let entryRoot = roots[0]
  if (entryRoot.data.nodeType === 'Root') {
    const rootChildren = children.get(entryRoot.id) || []
    if (rootChildren.length === 0) throw new Error(`${graph.id} 的根节点没有子节点`)
    if (rootChildren.length > 1) throw new Error(`${graph.id} 的 Root 节点下有多个子节点，只能有一个`)
    entryRoot = rootChildren[0]
  }

  const visited = new Set<string>()
  const renderNode = (node: BehaviorNode, depth: number): string => {
    if (visited.has(node.id)) throw new Error(`${graph.id} 中存在重复引用或环路`)
    visited.add(node.id)
    if (node.data.nodeType === 'Root') {
      const rootChildren = children.get(node.id) || []
      return rootChildren.map((child) => renderNode(child, depth)).join('\n')
    }
    const indent = '    '.repeat(depth)
    const tag = nodeTag(node)
    const attributes: Array<[string, string]> = []
    if (['Action', 'Condition', 'SubTree', 'SubTreePlus'].includes(tag)) attributes.push(['ID', node.data.registrationName])
    if (node.data.label !== node.data.registrationName && node.data.label !== node.data.nodeType) attributes.push(['name', node.data.label])
    Object.entries(node.data.ports).forEach(([key, value]) => {
      if (key.trim()) attributes.push([key.trim(), value])
    })
    const attrs = attributes.map(([key, value]) => ` ${key}="${escapeXml(value)}"`).join('')
    const childNodes = (children.get(node.id) || []).filter((c) => c.data.nodeType !== 'Root')
    if (childNodes.length === 0) return `${indent}<${tag}${attrs}/>`
    const content = childNodes.map((child) => renderNode(child, depth + 1)).join('\n')
    return `${indent}<${tag}${attrs}>\n${content}\n${indent}</${tag}>`
  }

  return `  <BehaviorTree ID="${escapeXml(graph.id)}">\n${renderNode(entryRoot, 2)}\n  </BehaviorTree>`
}

function renderNodeModels(models: CustomNodeModel[]) {
  if (!models.length) return ''
  const content = models.map((model) => {
    const tag = model.category === 'condition' ? 'Condition' : model.category === 'decorator' ? 'Decorator' : model.category === 'control' ? 'Control' : 'Action'
    const ports = model.ports.map((port) => {
      const defaultAttribute = port.defaultValue === undefined ? '' : ` default="${escapeXml(port.defaultValue)}"`
      const typeAttribute = port.type ? ` type="${escapeXml(port.type)}"` : ''
      return `      <${port.direction} name="${escapeXml(port.name)}"${defaultAttribute}${typeAttribute}>${escapeXml(port.description)}</${port.direction}>`
    }).join('\n')
    return ports ? `    <${tag} ID="${escapeXml(model.id)}">\n${ports}\n    </${tag}>` : `    <${tag} ID="${escapeXml(model.id)}"/>`
  }).join('\n')
  return `\n  <TreeNodesModel>\n${content}\n  </TreeNodesModel>`
}

export function documentToXml(document: BehaviorTreeDocument) {
  const trees = syncedTreeGraphs(document)
  const treeXml = trees.map(renderTree).join('\n\n')
  const modelsXml = renderNodeModels(document.nodeModels || [])
  return `<?xml version="1.0" encoding="UTF-8"?>\n<root BTCPP_format="4" main_tree_to_execute="${escapeXml(document.mainTreeId)}">\n${treeXml}${modelsXml}\n</root>\n`
}

function categoryForModelTag(tag: string): NodeCategory {
  if (tag === 'Condition') return 'condition'
  if (tag === 'Decorator') return 'decorator'
  if (tag === 'Control') return 'control'
  if (tag === 'SubTree') return 'subtree'
  return 'action'
}

function nodeTypeForCategory(category: NodeCategory): NodeType {
  if (category === 'condition') return 'Condition'
  if (category === 'decorator') return 'Repeat'
  if (category === 'control') return 'Sequence'
  if (category === 'subtree') return 'SubTree'
  return 'Action'
}

function parseNodeModels(root: Element): CustomNodeModel[] {
  const container = Array.from(root.children).find((child) => child.tagName === 'TreeNodesModel')
  if (!container) return []
  return Array.from(container.children).flatMap((element) => {
    const id = element.getAttribute('ID')
    if (!id) return []
    const category = categoryForModelTag(element.tagName)
    const ports = Array.from(element.children).flatMap((portElement) => {
      if (!PORT_TAGS.has(portElement.tagName as NodePortModel['direction'])) return []
      const name = portElement.getAttribute('name')
      if (!name) return []
      const port: NodePortModel = {
        name,
        direction: portElement.tagName as NodePortModel['direction'],
        type: portElement.getAttribute('type') || '',
        description: portElement.textContent?.trim() || '',
      }
      if (portElement.hasAttribute('default')) port.defaultValue = portElement.getAttribute('default') || ''
      return [port]
    })
    return [{ id, category, nodeType: nodeTypeForCategory(category), ports }]
  })
}

function resolveElementType(element: Element, models: Map<string, CustomNodeModel>) {
  const tag = element.tagName
  if (NODE_DEFINITION_MAP.has(tag as NodeType)) {
    const definition = NODE_DEFINITION_MAP.get(tag as NodeType)!
    return { nodeType: tag as NodeType, category: definition.category }
  }
  if (tag === 'SubTreePlus') return { nodeType: 'SubTree' as NodeType, category: 'subtree' as NodeCategory }
  if (tag === 'Action') return { nodeType: 'Action' as NodeType, category: 'action' as NodeCategory }
  if (tag === 'Condition') return { nodeType: 'Condition' as NodeType, category: 'condition' as NodeCategory }
  const model = models.get(tag)
  if (model) return { nodeType: model.nodeType, category: model.category }
  const childCount = element.children.length
  if (childCount === 1) return { nodeType: 'Repeat' as NodeType, category: 'decorator' as NodeCategory }
  if (childCount > 1) return { nodeType: 'Sequence' as NodeType, category: 'control' as NodeCategory }
  return { nodeType: 'Action' as NodeType, category: 'action' as NodeCategory }
}

function parseBehaviorTree(element: Element, models: Map<string, CustomNodeModel>): BehaviorTreeGraph {
  const treeId = element.getAttribute('ID') || 'MainTree'
  const treeRoot = Array.from(element.children)[0]
  if (!treeRoot) return { id: treeId, nodes: [], edges: [] }

  const nodes: BehaviorNode[] = []
  const edges: BehaviorEdge[] = []
  let edgeIndex = 0

  const visit = (nodeElement: Element, parentId?: string) => {
    const { nodeType, category } = resolveElementType(nodeElement, models)
    const node = createNode(nodeType)
    const explicitId = nodeElement.getAttribute('ID')
    const registrationName = explicitId || (CONTROL_AND_DECORATOR_TYPES.has(nodeType) && NODE_DEFINITION_MAP.has(nodeElement.tagName as NodeType)
      ? nodeElement.tagName
      : nodeElement.tagName)
    const model = models.get(registrationName) || models.get(nodeElement.tagName)
    const ports: Record<string, string> = model
      ? Object.fromEntries(model.ports.map((port) => [port.name, port.defaultValue || '']))
      : {}
    Array.from(nodeElement.attributes).forEach((attribute) => {
      if (!['ID', 'name'].includes(attribute.name)) ports[attribute.name] = attribute.value
    })
    node.data = {
      ...node.data,
      label: nodeElement.getAttribute('name') || registrationName,
      registrationName,
      category,
      ports,
      xmlTag: nodeElement.tagName,
    }
    nodes.push(node)
    if (parentId) edges.push({ id: `edge_${treeId}_${edgeIndex++}`, source: parentId, target: node.id, type: 'smoothstep' })
    Array.from(nodeElement.children).forEach((child) => visit(child, node.id))
  }
  visit(treeRoot)
  return layoutGraph({ id: treeId, nodes, edges })
}

function inferMainTree(root: Element, trees: BehaviorTreeGraph[]) {
  const explicit = root.getAttribute('main_tree_to_execute')
  if (explicit && trees.some((tree) => tree.id === explicit)) return explicit

  const referenced = new Set<string>()
  trees.forEach((tree) => tree.nodes.forEach((node) => {
    if (node.data.nodeType === 'SubTree') referenced.add(node.data.registrationName)
  }))
  const rootCandidates = trees.filter((tree) => !referenced.has(tree.id))
  if (rootCandidates.length === 1) return rootCandidates[0].id
  return trees.find((tree) => tree.id === 'MainTree')?.id || trees.at(-1)?.id || 'MainTree'
}

export function xmlToDocument(xml: string): BehaviorTreeDocument {
  const parsed = new DOMParser().parseFromString(xml, 'application/xml')
  const parserError = parsed.querySelector('parsererror')
  if (parserError) throw new Error(`XML 解析失败：${parserError.textContent?.split('\n')[0] || '格式错误'}`)
  const root = parsed.documentElement
  const treeElements = Array.from(root.children).filter((child) => child.tagName === 'BehaviorTree')
  if (!treeElements.length) throw new Error('未找到 <BehaviorTree> 元素')

  const nodeModels = parseNodeModels(root)
  const modelMap = new Map(nodeModels.map((model) => [model.id, model]))
  const trees = treeElements.map((element) => parseBehaviorTree(element, modelMap))
  const mainTreeId = inferMainTree(root, trees)
  const activeTree = trees.find((tree) => tree.id === mainTreeId) || trees[0]

  return {
    format: 'arborflow/project',
    version: 1,
    title: mainTreeId,
    mainTreeId,
    activeTreeId: activeTree.id,
    trees,
    nodeModels,
    nodes: activeTree.nodes,
    edges: activeTree.edges,
  }
}
