import {
  GitBranch,
  ListTree,
  Repeat2,
  RotateCcw,
  ShieldCheck,
  ShieldX,
  Split,
  SquareFunction,
  TreePine,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import type { BehaviorNode, CustomNodeModel, NodeCategory, NodeType } from '../types'

export interface NodeDefinition {
  type: NodeType
  label: string
  description: string
  category: NodeCategory
  icon: LucideIcon
  defaultPorts?: Record<string, string>
}

export const CATEGORY_LABELS: Record<NodeCategory, string> = {
  control: '控制',
  decorator: '装饰',
  action: '动作',
  condition: '条件',
  subtree: '子树',
}

export const NODE_DEFINITIONS: NodeDefinition[] = [
  { type: 'Sequence', label: 'Sequence', description: '依次执行，遇失败停止', category: 'control', icon: ListTree },
  { type: 'Fallback', label: 'Fallback', description: '依次尝试，遇成功停止', category: 'control', icon: GitBranch },
  { type: 'Parallel', label: 'Parallel', description: '并行执行多个子节点', category: 'control', icon: Split, defaultPorts: { success_count: '1', failure_count: '1' } },
  { type: 'ReactiveSequence', label: 'Reactive Sequence', description: '每次 tick 从首节点重评估', category: 'control', icon: RotateCcw },
  { type: 'ReactiveFallback', label: 'Reactive Fallback', description: '响应式回退控制', category: 'control', icon: RotateCcw },
  { type: 'Inverter', label: 'Inverter', description: '反转成功与失败结果', category: 'decorator', icon: Repeat2 },
  { type: 'RetryUntilSuccessful', label: 'Retry', description: '失败后重试指定次数', category: 'decorator', icon: Repeat2, defaultPorts: { num_attempts: '3' } },
  { type: 'Repeat', label: 'Repeat', description: '重复执行指定次数', category: 'decorator', icon: Repeat2, defaultPorts: { num_cycles: '3' } },
  { type: 'ForceSuccess', label: 'Force Success', description: '强制返回成功', category: 'decorator', icon: ShieldCheck },
  { type: 'ForceFailure', label: 'Force Failure', description: '强制返回失败', category: 'decorator', icon: ShieldX },
  { type: 'Action', label: 'Action', description: '调用 ROS 动作或业务逻辑', category: 'action', icon: Zap },
  { type: 'Condition', label: 'Condition', description: '检查黑板或环境条件', category: 'condition', icon: SquareFunction },
  { type: 'SubTree', label: 'SubTree', description: '调用另一棵行为树', category: 'subtree', icon: TreePine },
  { type: 'AlwaysSuccess', label: 'Always Success', description: '始终返回成功', category: 'action', icon: ShieldCheck },
  { type: 'AlwaysFailure', label: 'Always Failure', description: '始终返回失败', category: 'action', icon: ShieldX },
]

export const NODE_DEFINITION_MAP = new Map(NODE_DEFINITIONS.map((definition) => [definition.type, definition]))

export function createNode(type: NodeType, position = { x: 80, y: 80 }): BehaviorNode {
  const definition = NODE_DEFINITION_MAP.get(type)!
  const id = `node_${crypto.randomUUID().replaceAll('-', '').slice(0, 10)}`
  const customName = type === 'Action' ? 'MyAction' : type === 'Condition' ? 'MyCondition' : type === 'SubTree' ? 'SubTreeID' : type
  return {
    id,
    type: 'behavior',
    position,
    data: {
      label: customName,
      nodeType: type,
      category: definition.category,
      registrationName: customName,
      ports: { ...(definition.defaultPorts || {}) },
      notes: '',
      breakpoint: false,
    },
  }
}

export function createNodeFromModel(model: CustomNodeModel, position = { x: 80, y: 80 }): BehaviorNode {
  const node = createNode(model.nodeType, position)
  node.data = {
    ...node.data,
    label: model.id,
    category: model.category,
    registrationName: model.id,
    xmlTag: model.id,
    ports: Object.fromEntries(model.ports.map((port) => [port.name, port.defaultValue || ''])),
  }
  return node
}

export function canHaveChildren(type: NodeType) {
  return !['Action', 'Condition', 'SubTree', 'AlwaysSuccess', 'AlwaysFailure'].includes(type)
}

export function maxChildren(type: NodeType) {
  if (['Inverter', 'RetryUntilSuccessful', 'Repeat', 'ForceSuccess', 'ForceFailure'].includes(type)) return 1
  return canHaveChildren(type) ? Number.POSITIVE_INFINITY : 0
}
