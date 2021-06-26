// Custom Jest transform implementation that injects test-specific babel presets.
module.exports = require('babel-jest').createTransformer({
    presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
    plugins: [
        '@babel/plugin-proposal-object-rest-spread',
        '@babel/plugin-transform-runtime',
        'transform-require-context',
        '@babel/plugin-proposal-optional-chaining'
    ]
});
