/* development | production | test */
const ENV = process.env.NODE_ENV || 'development';
const DEVELOPMENT = ENV === 'development';
const PRODUCTION = ENV === 'production';

const presetEnvOpts = {
    bugfixes: true,
    useBuiltIns: 'usage',
    corejs: '3.29',
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
