import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './en.json'
import am from './am.json'
import { KEYS, writeRaw, readRaw } from '../lib/store'

export const LANGUAGES = ['en', 'am']

const storedLanguage = () => (readRaw(KEYS.lang) === 'am' ? 'am' : 'en')

// Resources are bundled, so Amharic is available offline and on the first paint.
i18next.use(initReactI18next).init({
  resources: { en: { translation: en }, am: { translation: am } },
  lng: storedLanguage(),
  fallbackLng: 'en',
  supportedLngs: LANGUAGES,
  interpolation: { escapeValue: false },
  returnNull: false,
})

const applyDocumentLanguage = (lng) => {
  document.documentElement.lang = lng
  document.documentElement.dir = 'ltr'
}

applyDocumentLanguage(i18next.language)

export function setLanguage(lng) {
  const next = lng === 'am' ? 'am' : 'en'
  writeRaw(KEYS.lang, next)
  i18next.changeLanguage(next)
  applyDocumentLanguage(next)
}

export default i18next
