// Custom Jest transform implementation that injects test-specific babel presets.
module.exports = require('babel-jest').default.createTransformer({
    presets: ['@babel/preset-env', ['@babel/preset-react', { runtime: 'automatic' }], '@babel/preset-typescript'],
    plugins: [
        '@babel/plugin-proposal-object-rest-spread',
        '@babel/plugin-transform-runtime',
        '@babel/plugin-proposal-optional-chaining',
        'transform-class-properties',
        'transform-require-context'
    ]
});
