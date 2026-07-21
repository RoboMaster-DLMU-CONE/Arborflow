import type { BehaviorTreeDocument } from '../types'

export function serializeProject(document: BehaviorTreeDocument) {
  return JSON.stringify(document, null, 2) + '\n'
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
  return candidate as BehaviorTreeDocument
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
