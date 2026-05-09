import nxPlugin from '@nx/eslint-plugin';

export default [
  ...nxPlugin.configs['flat/base'],
  ...nxPlugin.configs['flat/typescript'],
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/.next/**'],
  },
];
