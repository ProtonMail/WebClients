/* development | production | test */
const ENV = process.env.NODE_ENV || 'development';
const DEVELOPMENT = ENV === 'development';
const PRODUCTION = ENV === 'production';

const presetEnvOpts = {
    bugfixes: true,
    corejs: '3.29',
    exclude: ['transform-typeof-symbol', 'es.array.push', 'web.dom-exception.stack'],
    useBuiltIns: 'usage',
};

module.exports = {
    presets: [
        ['@babel/preset-env', presetEnvOpts],
        ['@babel/preset-typescript'],
        ['@babel/preset-react', { development: !PRODUCTION, runtime: 'automatic' }],
    ],
    plugins: [
        DEVELOPMENT && require.resolve('react-refresh/babel'),
        PRODUCTION && [require.resolve('babel-plugin-transform-react-remove-prop-types'), { removeImport: true }],
    ].filter(Boolean),
};
