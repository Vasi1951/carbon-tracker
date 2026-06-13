const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  root: true,
  ignorePatterns: ['**/dist/**', '**/build/**', '**/coverage/**', 'playwright-report/**'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: [
      './tsconfig.json',
      './apps/*/tsconfig.json',
      './packages/*/tsconfig.json',
      './e2e/tsconfig.json',
    ],
  },
  plugins: ['@typescript-eslint', 'import'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:@typescript-eslint/strict-type-checked',
  ],
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: [
          './tsconfig.json',
          './apps/*/tsconfig.json',
          './packages/*/tsconfig.json',
        ],
      },
    },
  },
  rules: {
    // Quality guidelines
    'complexity': ['error', 8],
    'max-lines-per-function': ['error', { max: 25, skipBlankLines: true, skipComments: true }],
    '@typescript-eslint/no-explicit-any': 'error',
    
    // Conditional console rules
    'no-console': [isProd ? 'error' : 'warn', { allow: ['warn', 'error'] }],

    // Dependency boundaries (Dependency Inversion)
    'import/no-restricted-paths': [
      'error',
      {
        zones: [
          {
            target: './packages/domain/**/*',
            from: './packages/infrastructure/**/*',
            message: 'Architecture violation: /domain cannot import from /infrastructure.'
          },
          {
            target: './packages/application/**/*',
            from: './packages/infrastructure/**/*',
            message: 'Architecture violation: /application cannot import from /infrastructure.'
          }
        ]
      }
    ]
  },
  overrides: [
    // Ignore function line length and complexity in test files
    {
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx', 'e2e/**/*'],
      rules: {
        'max-lines-per-function': 'off',
        'complexity': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/unbound-method': 'off'
      }
    },
    // Ignore function line length and complexity in React components
    {
      files: ['**/*.tsx'],
      rules: {
        'max-lines-per-function': 'off',
        'complexity': 'off'
      }
    },
    // Enforce no relative imports above src/
    {
      files: ['**/src/*.ts', '**/src/*.tsx'],
      rules: {
        'no-restricted-imports': ['error', { patterns: ['../*'] }]
      }
    },
    {
      files: ['**/src/*/*.ts', '**/src/*/*.tsx'],
      rules: {
        'no-restricted-imports': ['error', { patterns: ['../../*'] }]
      }
    },
    {
      files: ['**/src/*/*/*.ts', '**/src/*/*/*.tsx'],
      rules: {
        'no-restricted-imports': ['error', { patterns: ['../../../*'] }]
      }
    },
    {
      files: ['**/src/*/*/*/*.ts', '**/src/*/*/*/*.tsx'],
      rules: {
        'no-restricted-imports': ['error', { patterns: ['../../../../*'] }]
      }
    }
  ]
};
