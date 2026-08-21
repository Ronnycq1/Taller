import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';

// Configuración de i18next
i18n
  .use(HttpBackend) // Cargar traducciones mediante fetch/HTTP
  .use(initReactI18next) // Vincular con React
  .init({
    backend: {
      // Ruta base donde están los archivos de traducción
      // Los archivos están en src/locales/{{lng}}/translation.json
      loadPath: '/locales/{{lng}}/translation.json',
      // Ruta para refresh/clear cache
      crossDomain: true,
    },
    fallbackLng: 'es', // Idioma por defecto
    debug: process.env.NODE_ENV === 'development',

    interpolation: {
      escapeValue: false, // React ya hace escaping automaticamente
    },

    // Idioma inicial basado en el navegador del usuario
    lng: navigator.language?.startsWith('en') ? 'en' : 'es',

    // Tiempo de caché para las traducciones (en ms)
    cache: {
      ttl: 86400000, // 24 horas
    },

    // Available languages
    supportedLngs: ['es', 'en'],
  });

export default i18n;

// Hook personalizado para usar traducciones en componentes funcionales
export const useTranslation = () => {
  const { t, i18n } = useTranslation();
  return { t, i18n };
};

/** Función helper para cambiar idioma dinámicamente */
export const changeLanguage = (language: 'es' | 'en') => {
  i18n.changeLanguage(language);
  // Guardar preferencia en localStorage
  localStorage.setItem('cq_language', language);
};

/** Obtener idioma actual */
export const getCurrentLanguage = (): 'es' | 'en' => {
  return i18n.language as 'es' | 'en';
};