// @ts-check
import antfu from '@antfu/eslint-config';

export default antfu(
  {
    type: 'lib',
    pnpm: false,
    regexp: false,
  },
  [
    {
      rules: {
        'test/prefer-lowercase-title': ['off'],
        'curly': ['error', 'all'],
        'style/brace-style': 'error',
        'style/multiline-ternary': ['error', 'always'],
        'unused-imports/no-unused-imports': 'warn',
        'unused-imports/no-unused-vars': 'off',
        'no-unused-vars': 'off',
        'ts/no-unused-vars': [
          'warn',
          {
            args: 'after-used',
            argsIgnorePattern: '^_',
            vars: 'all',
            varsIgnorePattern: '^_',
          },
        ],
        'no-console': ['warn'],
        'style/semi': ['error', 'always'],
        'style/indent': ['error', 2, { SwitchCase: 1 }],
        'style/max-len': [
          'warn',
          {
            code: 120,
            tabWidth: 2,
            ignoreRegExpLiterals: true,
            ignoreStrings: true,
            ignoreUrls: true,
            ignoreTemplateLiterals: true,
            ignoreComments: true,
          },
        ],
        '@stylistic/comma-dangle': ['error', 'always-multiline'],
        'style/quotes': ['error', 'single'],
        'style/max-statements-per-line': [0],
        'max-lines': ['warn', {
          max: 500,
          skipComments: true,
          skipBlankLines: true,
        }],
      },
    },
  ],
);
