module.exports = {
  env: {
      es2020: true,
      node: true,
      jest: true
  },
  parser: '@typescript-eslint/parser',
  extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'prettier'
  ],
  parserOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module'
  },
  plugins: [
      '@typescript-eslint',
      'eslint-plugin-jest',
      'eslint-plugin-tsdoc'
  ],
  ignorePatterns: [
      'dist/**/*',
      '**/node_modules/**',
  ],
  rules: {
    'no-debugger': 'warn',
    'tsdoc/syntax': 'warn',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/ban-ts-comment': 'warn',
    '@typescript-eslint/naming-convention': [
        'error',
        {
            selector: ['class'],
            format: ['PascalCase'],
        }, {
            selector: ['parameter'],
            format: ['camelCase'],
        }, {
            selector: ['typeProperty'],
            format: ['camelCase'],
        },
        {
            selector: 'variable',
            format: ['camelCase', 'UPPER_CASE'],
        },
        {
            selector: ['variable'],
            modifiers: ['exported'],
            format: ['PascalCase', 'camelCase', 'UPPER_CASE'],
        },
    ]
  }
}