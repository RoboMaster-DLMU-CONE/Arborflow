/// <reference types="vite/client" />

interface ArborFlowDesktopApi {
  platform: string
  openText: (options: {
    filters: Array<{ name: string; extensions: string[] }>
  }) => Promise<{ path: string; content: string } | null>
  saveText: (options: {
    path?: string
    prompt?: boolean
    defaultPath?: string
    content: string
    filters: Array<{ name: string; extensions: string[] }>
  }) => Promise<{ path: string } | null>
  onMenuCommand: (callback: (command: string) => void) => () => void
}

interface Window {
  arborflow?: ArborFlowDesktopApi
}
