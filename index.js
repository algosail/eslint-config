// @ts-check
import babelParser from '@babel/eslint-parser'
import perfectionist from 'eslint-plugin-perfectionist'
import stylistic from '@stylistic/eslint-plugin'

export default [
  { ignores: ['dist/**', 'node_modules/**'] },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        sourceType: 'module',
        babelOptions: {
          babelrc: false,
          configFile: false,
          parserOpts: { plugins: ['typescript'] },
        },
      },
    },
    plugins: {
      '@stylistic': stylistic,
      '@perfectionist': perfectionist,
    },
    rules: {
      '@perfectionist/sort-imports': [
        'error',
        {
          type: 'alphabetical',
          newlinesBetween: 'ignore',
          newlinesInside: 'ignore',
          sortSideEffects: true,
          useExperimentalDependencyDetection: false,
          groups: [
            ['type-builtin', 'type-external', 'type-subpath'],
            ['value-builtin', 'value-external', 'value-subpath'],
            ['type-internal', 'type-parent', 'type-sibling', 'type-index'],
            ['side-effect', 'value-internal', 'value-parent', 'value-sibling', 'value-index'],
            'unknown',
          ],
        },
      ],
      '@perfectionist/sort-named-imports': [
        'error',
        {
          type: 'alphabetical',
          groups: ['import'],
        },
      ],
      '@stylistic/function-call-spacing': [
        'error',
        'always',
        {
          allowNewlines: true,
          optionalChain: { before: false, after: true },
        },
      ],
      '@stylistic/semi': ['error', 'never'],
      '@stylistic/quote-props': ['error', 'as-needed'],
      '@stylistic/quotes': [
        'error',
        'single',
        {
          avoidEscape: true,
          allowTemplateLiterals: 'always',
        },
      ],
      '@stylistic/comma-dangle': ['error', 'always-multiline'],
      '@stylistic/comma-spacing': ['error', { before: false, after: true }],
      '@stylistic/comma-style': ['error', 'last'],
      '@stylistic/object-curly-spacing': ['error', 'always'],
      '@stylistic/array-bracket-spacing': ['error', 'never'],
      '@stylistic/computed-property-spacing': ['error', 'never'],
      '@stylistic/space-in-parens': ['error', 'never'],
      '@stylistic/space-before-function-paren': [
        'error',
        {
          anonymous: 'never',
          named: 'never',
          asyncArrow: 'always',
          catch: 'always',
        },
      ],
      '@stylistic/space-before-blocks': 'error',
      '@stylistic/keyword-spacing': ['error', { before: true, after: true }],
      '@stylistic/space-infix-ops': 'error',
      '@stylistic/space-unary-ops': 'error',
      '@stylistic/arrow-spacing': ['error', { before: true, after: true }],
      '@stylistic/arrow-parens': ['error', 'always'],
      '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: true }],
      '@stylistic/block-spacing': ['error', 'always'],
      '@stylistic/key-spacing': ['error', { beforeColon: false, afterColon: true }],
      '@stylistic/operator-linebreak': [
        'error',
        'after',
        {
          overrides: { '?': 'before', ':': 'before', '|': 'before', '&': 'before' },
        },
      ],
      '@stylistic/dot-location': ['error', 'property'],
      '@stylistic/rest-spread-spacing': ['error', 'never'],
      '@stylistic/template-curly-spacing': ['error', 'never'],
      '@stylistic/template-tag-spacing': ['error', 'never'],
      '@stylistic/no-whitespace-before-property': 'error',
      '@stylistic/no-multi-spaces': 'error',
      '@stylistic/no-trailing-spaces': 'error',
      '@stylistic/no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0, maxBOF: 0 }],
      '@stylistic/no-floating-decimal': 'error',
      '@stylistic/no-extra-semi': 'error',
      '@stylistic/eol-last': ['error', 'always'],
      '@stylistic/linebreak-style': ['error', 'unix'],
      '@stylistic/switch-colon-spacing': 'error',
      '@stylistic/type-annotation-spacing': 'error',
      '@stylistic/type-generic-spacing': 'error',
      '@stylistic/member-delimiter-style': [
        'error',
        {
          multiline: { delimiter: 'none', requireLast: false },
          singleline: { delimiter: 'semi', requireLast: false },
        },
      ],
    },
  },
]
