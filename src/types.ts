import type { Edge, Node } from '@xyflow/react'

export type NodeCategory = 'control' | 'decorator' | 'action' | 'condition' | 'subtree'

export type NodeType =
  | 'Sequence'
  | 'Fallback'
  | 'Parallel'
  | 'ReactiveSequence'
  | 'ReactiveFallback'
  | 'Inverter'
  | 'RetryUntilSuccessful'
  | 'Repeat'
  | 'ForceSuccess'
  | 'ForceFailure'
  | 'Action'
  | 'Condition'
  | 'SubTree'
  | 'AlwaysSuccess'
  | 'AlwaysFailure'

export type RuntimeStatus = 'IDLE' | 'RUNNING' | 'SUCCESS' | 'FAILURE' | 'SKIPPED'

export type BehaviorNodeData = {
  label: string
  nodeType: NodeType
  category: NodeCategory
  registrationName: string
  ports: Record<string, string>
  notes: string
  breakpoint: boolean
  xmlTag?: string
  runtimeStatus?: RuntimeStatus
  [key: string]: unknown
}

export type BehaviorNode = Node<BehaviorNodeData, 'behavior'>
export type BehaviorEdge = Edge

export interface BehaviorTreeGraph {
  id: string
  nodes: BehaviorNode[]
  edges: BehaviorEdge[]
}

export interface NodePortModel {
  name: string
  direction: 'input_port' | 'output_port' | 'inout_port'
  type: string
  defaultValue?: string
  description: string
}

export interface CustomNodeModel {
  id: string
  nodeType: NodeType
  category: NodeCategory
  ports: NodePortModel[]
}

export interface BehaviorTreeDocument {
  format: 'arborflow/project'
  version: 1
  title: string
  mainTreeId: string
  activeTreeId?: string
  trees?: BehaviorTreeGraph[]
  nodeModels?: CustomNodeModel[]
  nodes: BehaviorNode[]
  edges: BehaviorEdge[]
}

export interface ValidationIssue {
  severity: 'error' | 'warning'
  message: string
  nodeId?: string
}

export interface RuntimeEvent {
  id: string
  at: number
  nodeRef: string
  status: RuntimeStatus
  matchedNodeIds: string[]
}
