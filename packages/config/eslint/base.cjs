module.exports = [
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,tsx,jsx}'],
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    },
  },
];
