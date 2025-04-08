import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import de from './locales/de.json'
import es from './locales/es.json'
import it from './locales/it.json'
import fr from './locales/fr.json'
import zh from './locales/zh.json'

const messages = {
  en,
  de,
  es,
  it,
  fr,
  zh
}

export const i18n = createI18n({
  legacy: false,
  locale: 'en',
  fallbackLocale: 'en',
  messages
}) 