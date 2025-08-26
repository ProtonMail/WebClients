/* development | production | test */
const ENV = process.env.NODE_ENV || 'development';
/* chrome | firefox | safari */
const BUILD_TARGET = process.env.BUILD_TARGET || 'chrome';
const DEVELOPMENT = ENV === 'development';
const PRODUCTION = ENV === 'production';
const RUNTIME_RELOAD = Boolean(process.env.RUNTIME_RELOAD);

const presetEnvOpts = {
    bugfixes: true,
    corejs: require('core-js/package.json').version,
    useBuiltIns: 'usage',
    debug: false,
};

module.exports = {
    presets: [
        ['@babel/preset-env', presetEnvOpts],
        ['@babel/preset-typescript'],
        ['@babel/preset-react', { development: !PRODUCTION, runtime: 'automatic' }],
    ],
    plugins: [
        BUILD_TARGET !== 'safari' && DEVELOPMENT && !RUNTIME_RELOAD && require.resolve('react-refresh/babel'),
        PRODUCTION && [require.resolve('babel-plugin-transform-react-remove-prop-types'), { removeImport: true }],
    ].filter(Boolean),
};
