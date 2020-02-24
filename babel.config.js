'use strict'

module.exports = {
  plugins: [
    '@babel/plugin-proposal-class-properties',
    '@babel/plugin-proposal-nullish-coalescing-operator',
    '@babel/plugin-proposal-dynamic-import',
    '@babel/plugin-transform-modules-commonjs',
  ],
  presets: ['@babel/preset-typescript'],
}
