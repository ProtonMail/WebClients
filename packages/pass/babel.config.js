// The Extension build handles transpiling & bundling with Webpack
// and leverages Babel with its own configuration. This configuration
// is only consumed by babel-jest for tests at the moment.

const presetEnvOpts = {
    bugfixes: true,
    useBuiltIns: 'usage',
    corejs: '3.29',
};

module.exports = {
    presets: [['@babel/preset-env', presetEnvOpts], '@babel/preset-typescript'],
};
