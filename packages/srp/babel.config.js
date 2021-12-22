module.exports = (api) => {
    // Cache configuration is a required option according to mocha
    api.cache(false);
    return {
        targets: 'node 16',
        presets: ['@babel/preset-env', '@babel/preset-typescript'],
    };
};
