import React from 'react';
import { usei18n } from '../../hooks/usei18n';

/** Página de demo de internacionalización */
export const I18nDemoPage: React.FC = () => {
  const { language, t, switchLanguage, getCurrentLanguage } = usei18n();

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-900">
        🌐 Internacionalización i18n
      </h1>

      <div className="max-w-md mx-auto space-y-4">
        {/* Información del idioma actual */}
        <div>
          <p className="text-sm text-gray-600 mb-2">Idioma actual:</p>
          <p className="font-medium text-lg" id="current-lang">
            {language === 'es' ? 'Español' : 'English'}
          </p>
        </div>

        {/* Botones para cambiar idioma */}
        <div className="flex gap-3">
          <button
            onClick={() => switchLanguage('es')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              language === 'es' 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Español
          </button>
          <button
            onClick={() => switchLanguage('en')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
              language === 'en' 
                ? 'bg-blue-600 text-white' 
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            English
          </button>
        </div>

        {/* Elementos traducidos */}
        <div>
          <p className="text-sm text-gray-600 mb-2">Traducciones:</p>
          <ul className="list-disc list-inside space-y-1 text-left">
            <li>{t('welcome')}</li>
            <li>{t('vehicles')}</li>
            <li>{t('dashboard')}</li>
            <li>{t('logout')}</li>
            <li>{t('dark_mode')}</li>
          </ul>
        </div>

        {/* Información técnica */}
        <div>
          <p className="text-sm text-gray-600 mb-2">Detalles:</p>
          <p className="text-xs text-gray-500">
            Idioma actual: <strong>{getCurrentLanguage()}</strong>
          </p>
          <p className="text-xs text-gray-500">
            Guardado en localStorage: {localStorage.getItem('cq_language') || 'ninguno'}
          </p>
        </div>
      </div>
    </div>
  );
};
