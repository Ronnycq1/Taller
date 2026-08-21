import tseslint from 'typescript-eslint';
import pluginReact from '@eslint-react/jsx';
import pluginReactHooks from 'eslint-react-hooks';
import pluginImport from 'eslint-plugin-import';
import pluginJsxA11y from 'eslint-plugin-jsx-a11y';
import pluginReactA11y from 'eslint-plugin-react-a11y';
import pluginPrettier from 'eslint-plugin-prettier';

const baseConfig = [
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      rules: {
        'no-unused-vars': 'warn',
        'react/react-attributes': 'error',
        'react/jsx-no-undef': 'error',
        'react/jsx-props-no-defaults': ['error', { enforceFor: ['props'] }],
      },
    },
    plugins: {
      react: pluginReact,
      'react-hooks': pluginReactHooks,
      import: pluginImport,
      'jsx-a11y': pluginJsxA11y,
      'react-a11y': pluginReactA11y,
    },
  },
];

export default tseslint(
  ...baseConfig,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ignores: ['node_modules', '.next', '.graphify-out'],
    rules: {
      // JSX A11y rules
      'jsx-a11y/img-alt-has-text': 'error',
      'jsx-a11y/alt-text-has-content': 'error',
      'jsx-a11y/heading-has-content': 'error',
      'jsx-a11y/label-has-associated-control': 'error',
      'jsx-a11y/button-has-text': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/no_non_interactive_element_has_click_handler': 'error',
      'jsx-a11y/focus-visible': 'warn',
      'jsx-a11y/no_non_interactive_element_focus': 'error',

      // React A11y rules
      'react-a11y/focus-management': 'warn',
      'react-a11y/focus-visible': 'warn',
      'react-a11y/mouse-event-has-key-event': 'warn',
      'react-a11y/no-redundant-aria': 'error',

      // Personalizadas
    },
  },
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.plugin/react/recommended,
);