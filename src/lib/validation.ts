import { maxChildren } from './catalog'
import type { BehaviorTreeDocument, ValidationIssue } from '../types'

export function validateDocument(document: BehaviorTreeDocument): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const incoming = new Map(document.nodes.map((node) => [node.id, 0]))
  const outgoing = new Map(document.nodes.map((node) => [node.id, 0]))

  document.edges.forEach((edge) => {
    incoming.set(edge.target, (incoming.get(edge.target) || 0) + 1)
    outgoing.set(edge.source, (outgoing.get(edge.source) || 0) + 1)
  })

  const roots = document.nodes.filter((node) => (incoming.get(node.id) || 0) === 0)
  if (document.nodes.length === 0) issues.push({ severity: 'warning', message: '画布为空，请添加根节点' })
  if (roots.length > 1) issues.push({ severity: 'error', message: `检测到 ${roots.length} 个根节点，导出 XML 前必须连接为一棵树` })
  if (roots.length === 0 && document.nodes.length > 0) issues.push({ severity: 'error', message: '没有根节点，树中可能存在环路' })

  document.nodes.forEach((node) => {
    const childCount = outgoing.get(node.id) || 0
    const limit = maxChildren(node.data.nodeType)
    if (childCount > limit) {
      issues.push({ severity: 'error', nodeId: node.id, message: `${node.data.label} 最多允许 ${limit} 个子节点` })
    }
    if (limit > 0 && childCount === 0) {
      issues.push({ severity: 'warning', nodeId: node.id, message: `${node.data.label} 尚未连接子节点` })
    }
    if (!node.data.registrationName.trim()) {
      issues.push({ severity: 'error', nodeId: node.id, message: `${node.data.label} 的注册名称不能为空` })
    }
  })

  return issues
}

export function wouldCreateCycle(document: BehaviorTreeDocument, source: string, target: string) {
  if (source === target) return true
  const children = new Map<string, string[]>()
  document.edges.forEach((edge) => children.set(edge.source, [...(children.get(edge.source) || []), edge.target]))
  const stack = [target]
  const visited = new Set<string>()
  while (stack.length) {
    const current = stack.pop()!
    if (current === source) return true
    if (visited.has(current)) continue
    visited.add(current)
    stack.push(...(children.get(current) || []))
  }
  return false
}
