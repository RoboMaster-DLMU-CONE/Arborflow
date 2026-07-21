import type { BehaviorTreeDocument, BehaviorTreeGraph } from '../types'

export function activeTreeId(document: BehaviorTreeDocument) {
  return document.activeTreeId || document.mainTreeId
}

export function syncedTreeGraphs(document: BehaviorTreeDocument): BehaviorTreeGraph[] {
  const currentId = activeTreeId(document)
  const currentGraph: BehaviorTreeGraph = {
    id: currentId,
    nodes: document.nodes,
    edges: document.edges,
  }
  if (!document.trees?.length) return [currentGraph]

  let replaced = false
  const trees = document.trees.map((tree) => {
    if (tree.id !== currentId) return tree
    replaced = true
    return currentGraph
  })
  return replaced ? trees : [...trees, currentGraph]
}

export function syncActiveTree(document: BehaviorTreeDocument): BehaviorTreeDocument {
  return { ...document, activeTreeId: activeTreeId(document), trees: syncedTreeGraphs(document) }
}

export function switchDocumentTree(document: BehaviorTreeDocument, treeId: string): BehaviorTreeDocument {
  const synced = syncActiveTree(document)
  const target = synced.trees?.find((tree) => tree.id === treeId)
  if (!target) return document
  return {
    ...synced,
    activeTreeId: treeId,
    nodes: target.nodes,
    edges: target.edges,
  }
}
