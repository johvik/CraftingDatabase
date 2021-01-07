module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: [
    "airbnb-typescript/base",
    "plugin:jest/recommended",
    "prettier/@typescript-eslint",
    "plugin:prettier/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 12,
    project: "./tsconfig.json",
    createDefaultProgram: true,
  },
  plugins: ["@typescript-eslint", "prettier"],
  rules: {
    "@typescript-eslint/type-annotation-spacing": "error",
  },
};
