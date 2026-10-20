import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from '../locales/en.json'
import am from '../locales/am.json'
import { KEYS, readRaw, writeRaw } from './store'

export const LANGUAGES = ['en', 'am']

export const getLang = () => {
  const saved = readRaw(KEYS.lang)
  return LANGUAGES.includes(saved) ? saved : 'en'
}

/** Intl tag. Amharic dates stay on the Gregorian calendar with Latin digits, so dates read the same everywhere. */
export const localeTag = (lang = getLang()) => (lang === 'am' ? 'am-ET-u-ca-gregory-nu-latn' : 'en-GB-u-ca-gregory-nu-latn')

export const setLang = (lang) => {
  const next = LANGUAGES.includes(lang) ? lang : 'en'
  writeRaw(KEYS.lang, next)
  i18next.changeLanguage(next)
  document.documentElement.lang = next
  return next
}

export const initI18n = () => {
  const lang = getLang()
  i18next.use(initReactI18next).init({
    resources: { en: { translation: en }, am: { translation: am } },
    lng: lang,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    returnNull: false,
  })
  document.documentElement.lang = lang
  return i18next
}

/** Formats a date for the current language. `options` are standard Intl.DateTimeFormat options. */
export const formatDate = (value, options = { month: 'short', day: 'numeric' }, lang = getLang()) => {
  const date = value instanceof Date ? value : new Date(`${value}T12:00:00`)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(localeTag(lang), options).format(date)
}

export const formatNumber = (value, lang = getLang()) => new Intl.NumberFormat(localeTag(lang)).format(value)

export default i18next
