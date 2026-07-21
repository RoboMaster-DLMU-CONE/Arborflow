import { createNode, NODE_DEFINITION_MAP } from './catalog'
import { layoutDocument } from './layout'
import type { BehaviorEdge, BehaviorNode, BehaviorTreeDocument, NodeType } from '../types'

const CONTROL_AND_DECORATOR_TYPES = new Set<NodeType>([
  'Sequence', 'Fallback', 'Parallel', 'ReactiveSequence', 'ReactiveFallback',
  'Inverter', 'RetryUntilSuccessful', 'Repeat', 'ForceSuccess', 'ForceFailure',
])

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function nodeTag(node: BehaviorNode) {
  if (node.data.nodeType === 'SubTree') return 'SubTree'
  if (node.data.nodeType === 'Action') return 'Action'
  if (node.data.nodeType === 'Condition') return 'Condition'
  return node.data.nodeType
}

export function documentToXml(document: BehaviorTreeDocument) {
  if (document.nodes.length === 0) throw new Error('画布为空，无法导出 XML')
  const incoming = new Map(document.nodes.map((node) => [node.id, 0]))
  document.edges.forEach((edge) => incoming.set(edge.target, (incoming.get(edge.target) || 0) + 1))
  const roots = document.nodes.filter((node) => (incoming.get(node.id) || 0) === 0)
  if (roots.length !== 1) throw new Error(`XML 只能导出一棵完整树，当前检测到 ${roots.length} 个根节点`)

  const byId = new Map(document.nodes.map((node) => [node.id, node]))
  const children = new Map<string, BehaviorNode[]>()
  document.edges.forEach((edge) => {
    const child = byId.get(edge.target)
    if (child) children.set(edge.source, [...(children.get(edge.source) || []), child])
  })
  children.forEach((items) => items.sort((a, b) => a.position.x - b.position.x))

  const visited = new Set<string>()
  const renderNode = (node: BehaviorNode, depth: number): string => {
    if (visited.has(node.id)) throw new Error('树中存在重复引用或环路，无法导出 XML')
    visited.add(node.id)
    const indent = '    '.repeat(depth)
    const tag = nodeTag(node)
    const attributes: Array<[string, string]> = []
    if (['Action', 'Condition', 'SubTree'].includes(tag)) attributes.push(['ID', node.data.registrationName])
    if (node.data.label !== node.data.registrationName && node.data.label !== node.data.nodeType) attributes.push(['name', node.data.label])
    Object.entries(node.data.ports).forEach(([key, value]) => {
      if (key.trim()) attributes.push([key.trim(), value])
    })
    const attrs = attributes.map(([key, value]) => ` ${key}="${escapeXml(value)}"`).join('')
    const childNodes = children.get(node.id) || []
    if (childNodes.length === 0) return `${indent}<${tag}${attrs}/>`
    const content = childNodes.map((child) => renderNode(child, depth + 1)).join('\n')
    return `${indent}<${tag}${attrs}>\n${content}\n${indent}</${tag}>`
  }

  const treeXml = renderNode(roots[0], 2)
  return `<?xml version="1.0" encoding="UTF-8"?>\n<root BTCPP_format="4" main_tree_to_execute="${escapeXml(document.mainTreeId)}">\n    <BehaviorTree ID="${escapeXml(document.mainTreeId)}">\n${treeXml}\n    </BehaviorTree>\n</root>\n`
}

function elementType(element: Element): NodeType {
  const tag = element.tagName
  if (NODE_DEFINITION_MAP.has(tag as NodeType)) return tag as NodeType
  if (tag === 'SubTreePlus') return 'SubTree'
  const children = Array.from(element.children)
  return children.length ? 'Sequence' : 'Action'
}

export function xmlToDocument(xml: string): BehaviorTreeDocument {
  const parsed = new DOMParser().parseFromString(xml, 'application/xml')
  const parserError = parsed.querySelector('parsererror')
  if (parserError) throw new Error(`XML 解析失败：${parserError.textContent?.split('\n')[0] || '格式错误'}`)
  const behaviorTree = parsed.querySelector('BehaviorTree')
  if (!behaviorTree) throw new Error('未找到 <BehaviorTree> 元素')
  const treeRoot = Array.from(behaviorTree.children).find((child) => child.nodeType === Node.ELEMENT_NODE)
  if (!treeRoot) throw new Error('BehaviorTree 中没有根节点')

  const nodes: BehaviorNode[] = []
  const edges: BehaviorEdge[] = []
  let edgeIndex = 0

  const visit = (element: Element, parentId?: string) => {
    const type = elementType(element)
    const node = createNode(type)
    const idAttr = element.getAttribute('ID')
    const registrationName = idAttr || (CONTROL_AND_DECORATOR_TYPES.has(type) ? type : element.tagName)
    const label = element.getAttribute('name') || registrationName
    const ports: Record<string, string> = {}
    Array.from(element.attributes).forEach((attribute) => {
      if (!['ID', 'name', '_autoremap'].includes(attribute.name)) ports[attribute.name] = attribute.value
    })
    node.data = { ...node.data, label, registrationName, ports }
    nodes.push(node)
    if (parentId) {
      edges.push({ id: `edge_import_${edgeIndex++}`, source: parentId, target: node.id, type: 'smoothstep' })
    }
    Array.from(element.children).forEach((child) => visit(child, node.id))
  }
  visit(treeRoot)

  const root = parsed.documentElement
  const mainTreeId = root.getAttribute('main_tree_to_execute') || behaviorTree.getAttribute('ID') || 'MainTree'
  return layoutDocument({
    format: 'arborflow/project',
    version: 1,
    title: behaviorTree.getAttribute('ID') || 'Imported Tree',
    mainTreeId,
    nodes,
    edges,
  })
}
