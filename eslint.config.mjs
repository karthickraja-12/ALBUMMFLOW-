export default [
  {
    ignores: [".next/**", "node_modules/**", "out/**"],
  },
  {
    files: ["**/*.js", "**/*.jsx", "**/*.mjs"],
    rules: {
      "no-unused-vars": "warn",
    },
  },
];
