const path = require('path');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const env = require('../env/config');

const postcssPlugins = [];

if (env.isDistRelease()) {
    postcssPlugins.push(require('autoprefixer')(env.AUTOPREFIXER_CONFIG));
}

module.exports = [
    {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
            use: [
                {
                    loader: 'css-loader',
                    options: {
                        importLoaders: 1,
                        minimize: env.isDistRelease()
                    }
                }
            ]
        })
    },
    {
        test: /\.scss$/,
        use: ExtractTextPlugin.extract({
            use: [
                {
                    loader: 'css-loader',
                    options: {
                        minimize: env.isDistRelease()
                    }
                },
                {
                    loader: 'postcss-loader',
                    options: {
                        plugins: postcssPlugins
                    }
                },
                {
                    loader: 'sass-loader',
                    options: {
                        includePaths: [path.resolve('./src-tmp/sass')]
                    }
                }
            ]
        })
    }
];
