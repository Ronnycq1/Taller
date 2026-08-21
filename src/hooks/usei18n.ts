import { useEffect, useState } from 'react';
import i18n from '../i18n/i18n-config';
import { changeLanguage, getCurrentLanguage } from '../i18n/i18n-config';

// Verificar si hay preferencia guardada en localStorage
const storedLanguage = localStorage.getItem('cq_language') as 'es' | 'en' | null;

// Determinar idioma inicial
const initialLanguage = storedLanguage 
  ? storedLanguage 
  : (navigator.language?.startsWith('en') ? 'en' : 'es');

export const usei18n = () => {
  const [language, setLanguage] = useState<'es' | 'en'>(
    initialLanguage !== null ? initialLanguage : 'es'
  );

  // Aplicar idioma al hacer cambio
  const switchLanguage = (lang: 'es' | 'en') => {
    setLanguage(lang);
    changeLanguage(lang);
  };

  return {
    language,
    t: i18n.t,
    i18n,
    switchLanguage,
    getCurrentLanguage,
  };
};