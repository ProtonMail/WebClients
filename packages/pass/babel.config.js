// The Extension build handles transpiling & bundling with Webpack
// and leverages Babel with its own configuration. This configuration
// is only consumed by babel-jest for tests at the moment.

const presetEnvOpts = {
    bugfixes: true,
    useBuiltIns: 'usage',
    corejs: require('core-js/package.json').version,
    shippedProposals: true /* polyfill typed-array base64 and hex functions */,
};

module.exports = {
    presets: [
        ['@babel/preset-env', presetEnvOpts],
        '@babel/preset-typescript',
        ['@babel/preset-react', { development: true, runtime: 'automatic' }],
    ],
};
