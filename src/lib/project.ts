import { createNode } from './catalog'
import { syncActiveTree, switchDocumentTree } from './trees'
import type { BehaviorEdge, BehaviorNode, BehaviorTreeDocument } from '../types'

export function serializeProject(document: BehaviorTreeDocument) {
  return JSON.stringify(syncActiveTree(document), null, 2) + '\n'
}

/** Ensure the active tree has a Root node at the top. If not, add one. */
export function ensureRootNode(nodes: BehaviorNode[], edges: BehaviorEdge[]): { nodes: BehaviorNode[]; edges: BehaviorEdge[] } {
  const hasRoot = nodes.some((n) => n.data.nodeType === 'Root')
  if (hasRoot) return { nodes, edges }

  const incoming = new Map<string, number>()
  edges.forEach((e) => incoming.set(e.target, (incoming.get(e.target) || 0) + 1))
  const roots = nodes.filter((n) => (incoming.get(n.id) || 0) === 0)
  if (roots.length === 0) return { nodes, edges }

  const rootNode = createNode('Root')
  rootNode.data = { ...rootNode.data, label: 'Root', registrationName: 'Root' }

  let edgeIndex = edges.length
  const newEdges: BehaviorEdge[] = [...edges]
  roots.forEach((r) => {
    newEdges.push({ id: `edge_root_${edgeIndex++}`, source: rootNode.id, target: r.id, type: 'smoothstep' })
  })

  return { nodes: [rootNode, ...nodes], edges: newEdges }
}

export function parseProject(content: string): BehaviorTreeDocument {
  const value: unknown = JSON.parse(content)
  if (!value || typeof value !== 'object') throw new Error('工程文件内容无效')
  const candidate = value as Partial<BehaviorTreeDocument>
  if (candidate.format !== 'arborflow/project' || candidate.version !== 1) {
    throw new Error('不是受支持的 ArborFlow 工程文件')
  }
  if (!Array.isArray(candidate.nodes) || !Array.isArray(candidate.edges)) {
    throw new Error('工程文件缺少节点或连接数据')
  }
  const document = candidate as BehaviorTreeDocument
  const { nodes, edges } = ensureRootNode(document.nodes, document.edges)
  document.nodes = nodes
  document.edges = edges
  const requestedTree = document.activeTreeId || document.mainTreeId
  return document.trees?.length ? switchDocumentTree(document, requestedTree) : document
}

export function downloadText(filename: string, content: string, type = 'text/plain') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function pickBrowserFile(accept: string) {
  return new Promise<{ path: string; content: string } | null>((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.onchange = async () => {
      const file = input.files?.[0]
      resolve(file ? { path: file.name, content: await file.text() } : null)
    }
    input.click()
  })
}
