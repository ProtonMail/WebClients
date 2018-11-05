const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

const minifyJS = () => {
    return {
        mangle: true,
        compress: true
    };
};

const uglifyPlugin = new UglifyJSPlugin({
    exclude: /\/node_modules/,
    cache: true,
    parallel: true,
    sourceMap: true,
    uglifyOptions: minifyJS()
});

module.exports = uglifyPlugin;
