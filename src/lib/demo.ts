import type { BehaviorTreeDocument } from '../types'

export function createDemoDocument(): BehaviorTreeDocument {
  return {
    format: 'arborflow/project',
    version: 1,
    title: 'Navigation Mission',
    mainTreeId: 'MainTree',
    nodes: [
      {
        id: 'root_node', type: 'behavior', position: { x: 475, y: 20 },
        data: { label: 'Root', nodeType: 'Root', category: 'root', registrationName: 'Root', ports: {}, notes: '', breakpoint: false },
      },
      {
        id: 'root_sequence', type: 'behavior', position: { x: 475, y: 140 },
        data: { label: 'Mission Sequence', nodeType: 'Sequence', category: 'control', registrationName: 'Sequence', ports: {}, notes: '主任务流程', breakpoint: false },
      },
      {
        id: 'battery_check', type: 'behavior', position: { x: 170, y: 320 },
        data: { label: 'Battery OK?', nodeType: 'Condition', category: 'condition', registrationName: 'BatteryOK', ports: { min_level: '{battery_threshold}' }, portDirections: { min_level: 'input' }, notes: '', breakpoint: false },
      },
      {
        id: 'navigation_fallback', type: 'behavior', position: { x: 475, y: 320 },
        data: { label: 'Navigate Safely', nodeType: 'Fallback', category: 'control', registrationName: 'Fallback', ports: {}, notes: '', breakpoint: false },
      },
      {
        id: 'report_action', type: 'behavior', position: { x: 785, y: 320 },
        data: { label: 'Report Result', nodeType: 'Action', category: 'action', registrationName: 'ReportResult', ports: { topic: '/mission/result' }, portDirections: { topic: 'input' }, notes: '', breakpoint: false },
      },
      {
        id: 'at_goal', type: 'behavior', position: { x: 340, y: 520 },
        data: { label: 'Already At Goal?', nodeType: 'Condition', category: 'condition', registrationName: 'AtGoal', ports: { target: '{goal}' }, portDirections: { target: 'input' }, notes: '', breakpoint: false },
      },
      {
        id: 'navigate_action', type: 'behavior', position: { x: 610, y: 520 },
        data: { label: 'Navigate To Pose', nodeType: 'Action', category: 'action', registrationName: 'NavigateToPose', ports: { goal: '{goal}', server_timeout: '5000' }, portDirections: { goal: 'input', server_timeout: 'input' }, notes: '调用 Nav2 action server', breakpoint: true },
      },
    ],
    edges: [
      { id: 'e-root-seq', source: 'root_node', target: 'root_sequence', type: 'smoothstep' },
      { id: 'e-root-battery', source: 'root_sequence', target: 'battery_check', type: 'smoothstep' },
      { id: 'e-root-nav', source: 'root_sequence', target: 'navigation_fallback', type: 'smoothstep' },
      { id: 'e-root-report', source: 'root_sequence', target: 'report_action', type: 'smoothstep' },
      { id: 'e-nav-goal', source: 'navigation_fallback', target: 'at_goal', type: 'smoothstep' },
      { id: 'e-nav-action', source: 'navigation_fallback', target: 'navigate_action', type: 'smoothstep' },
    ],
  }
}

export function createEmptyDocument(): BehaviorTreeDocument {
  return {
    format: 'arborflow/project',
    version: 1,
    title: 'Untitled Tree',
    mainTreeId: 'MainTree',
    nodes: [],
    edges: [],
  }
}
