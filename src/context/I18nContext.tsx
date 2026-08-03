import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import en from '../i18n/en'
import zh from '../i18n/zh'

export type Language = 'en' | 'zh'

const DICTS: Record<Language, Record<string, string>> = { en, zh }

interface I18nContextValue {
  lang: Language
  setLang: (lang: Language) => void
  t: (key: string, fallback?: string) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

function readLanguage(): Language {
  try {
    const stored = localStorage.getItem('arborflow-lang')
    if (stored === 'zh' || stored === 'en') return stored
  } catch { /* localStorage unavailable */ }
  return 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(readLanguage)

  const setLang = useCallback((next: Language) => {
    setLangState(next)
    try { localStorage.setItem('arborflow-lang', next) } catch { /* noop */ }
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en'
  }, [lang])

  const t = useCallback((key: string, fallback?: string): string => {
    return DICTS[lang]?.[key] || fallback || key
  }, [lang])

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
