module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: [
    'airbnb-typescript/base',
    'plugin:jest/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    project: './tsconfig.json',
  },
  plugins: [
    '@typescript-eslint',
  ],
  rules: {
    '@typescript-eslint/type-annotation-spacing': 'error',
    // TODO: Review these:
    'no-restricted-syntax': 'off',
    'no-await-in-loop': 'off',
    'guard-for-in': 'off',
  },
};
