// Custom Jest transform implementation that injects test-specific babel presets.
module.exports = require('babel-jest').default.createTransformer({
    presets: ['@babel/preset-env', ['@babel/preset-react', { runtime: 'automatic' }], '@babel/preset-typescript'],
    plugins: ['@babel/plugin-transform-runtime', 'transform-require-context'],
});
