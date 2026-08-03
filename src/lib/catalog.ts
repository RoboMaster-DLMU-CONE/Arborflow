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
  labelZh: string
  description: string
  descriptionZh: string
  category: NodeCategory
  icon: LucideIcon
  defaultPorts?: Record<string, string>
  defaultPortDirections?: Record<string, 'input' | 'output'>
}

export const CATEGORY_LABELS: Record<NodeCategory, string> = {
  control: '控制',
  decorator: '装饰',
  action: '动作',
  condition: '条件',
  subtree: '子树',
  root: '根',
}

export const NODE_DEFINITIONS: NodeDefinition[] = [
  { type: 'Sequence', label: 'Sequence', labelZh: '顺序执行', description: 'Execute children in order, stop on failure', descriptionZh: '依次执行子节点，遇失败停止', category: 'control', icon: ListTree },
  { type: 'Fallback', label: 'Fallback', labelZh: '选择回退', description: 'Try children in order, stop on success', descriptionZh: '依次尝试子节点，遇成功停止', category: 'control', icon: GitBranch },
  { type: 'Parallel', label: 'Parallel', labelZh: '并行执行', description: 'Execute multiple children in parallel', descriptionZh: '并行执行多个子节点', category: 'control', icon: Split, defaultPorts: { success_count: '1', failure_count: '1' }, defaultPortDirections: { success_count: 'input', failure_count: 'input' } },
  { type: 'ReactiveSequence', label: 'Reactive Sequence', labelZh: '响应序列', description: 'Re-evaluate from first child each tick', descriptionZh: '每次 tick 从头重新评估', category: 'control', icon: RotateCcw },
  { type: 'ReactiveFallback', label: 'Reactive Fallback', labelZh: '响应回退', description: 'Reactive fallback control node', descriptionZh: '响应式回退控制节点', category: 'control', icon: RotateCcw },
  { type: 'Inverter', label: 'Inverter', labelZh: '反转', description: 'Invert success/failure of child', descriptionZh: '反转子节点的成功/失败结果', category: 'decorator', icon: Repeat2 },
  { type: 'RetryUntilSuccessful', label: 'Retry', labelZh: '重试', description: 'Retry up to N times on failure', descriptionZh: '失败后重试指定次数', category: 'decorator', icon: Repeat2, defaultPorts: { num_attempts: '3' }, defaultPortDirections: { num_attempts: 'input' } },
  { type: 'Repeat', label: 'Repeat', labelZh: '重复', description: 'Repeat execution up to N cycles', descriptionZh: '重复执行指定次数', category: 'decorator', icon: Repeat2, defaultPorts: { num_cycles: '3' }, defaultPortDirections: { num_cycles: 'input' } },
  { type: 'ForceSuccess', label: 'Force Success', labelZh: '强制成功', description: 'Force return success', descriptionZh: '强制返回成功状态', category: 'decorator', icon: ShieldCheck },
  { type: 'ForceFailure', label: 'Force Failure', labelZh: '强制失败', description: 'Force return failure', descriptionZh: '强制返回失败状态', category: 'decorator', icon: ShieldX },
  { type: 'Action', label: 'Action', labelZh: '动作', description: 'Invoke a ROS action or business logic', descriptionZh: '调用 ROS 动作或业务逻辑', category: 'action', icon: Zap },
  { type: 'Condition', label: 'Condition', labelZh: '条件', description: 'Check blackboard or environment condition', descriptionZh: '检查黑板变量或环境条件', category: 'condition', icon: SquareFunction },
  { type: 'SubTree', label: 'SubTree', labelZh: '子树', description: 'Call another behavior tree', descriptionZh: '调用另一棵行为树', category: 'subtree', icon: TreePine },
  { type: 'AlwaysSuccess', label: 'Always Success', labelZh: '始终成功', description: 'Always return success', descriptionZh: '始终返回成功', category: 'action', icon: ShieldCheck },
  { type: 'AlwaysFailure', label: 'Always Failure', labelZh: '始终失败', description: 'Always return failure', descriptionZh: '始终返回失败', category: 'action', icon: ShieldX },
  { type: 'Root', label: 'Root', labelZh: '根节点', description: 'Root node of the behavior tree', descriptionZh: '行为树的根节点', category: 'control', icon: TreePine },
]

export const NODE_DEFINITION_MAP = new Map(NODE_DEFINITIONS.map((definition) => [definition.type, definition]))

export function createNode(type: NodeType, position = { x: 80, y: 80 }): BehaviorNode {
  const definition = NODE_DEFINITION_MAP.get(type)!
  const id = `node_${crypto.randomUUID().replaceAll('-', '').slice(0, 10)}`
  const customName = type === 'Root' ? 'Root' : type === 'Action' ? 'MyAction' : type === 'Condition' ? 'MyCondition' : type === 'SubTree' ? 'SubTreeID' : type
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
      portDirections: definition.defaultPortDirections ? { ...definition.defaultPortDirections } : undefined,
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

export function isRoot(type: NodeType) {
  return type === 'Root'
}
