import dagre from '@dagrejs/dagre'
import type { BehaviorTreeDocument } from '../types'

const NODE_WIDTH = 210
const NODE_HEIGHT = 84

export function layoutDocument(document: BehaviorTreeDocument): BehaviorTreeDocument {
  const graph = new dagre.graphlib.Graph()
  graph.setDefaultEdgeLabel(() => ({}))
  graph.setGraph({ rankdir: 'TB', nodesep: 46, ranksep: 88, marginx: 40, marginy: 40 })

  document.nodes.forEach((node) => graph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT }))
  document.edges.forEach((edge) => graph.setEdge(edge.source, edge.target))
  dagre.layout(graph)

  return {
    ...document,
    nodes: document.nodes.map((node) => {
      const position = graph.node(node.id)
      return {
        ...node,
        position: { x: position.x - NODE_WIDTH / 2, y: position.y - NODE_HEIGHT / 2 },
      }
    }),
  }
}
