const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const postcssPresetEnv = require('postcss-preset-env');

module.exports = ({ isProduction }) => {
    const postcssPlugins = isProduction ? [
        postcssPresetEnv({
            autoprefixer: {
                flexbox: 'no-2009',
            },
            stage: 3,
        })
    ] : [];

    return [
        {
            test: /\.css$/,
            use: [
                MiniCssExtractPlugin.loader,
                {
                    loader: 'css-loader',
                    options: {
                        importLoaders: 1
                    }
                }
            ]
        },
        {
            test: /\.scss$/,
            use: [
                'css-hot-loader',
                MiniCssExtractPlugin.loader,
                'css-loader',
                {
                    loader: 'postcss-loader',
                    options: {
                        ident: 'postcss',
                        plugins: postcssPlugins,
                        sourceMap: isProduction
                    }
                },
                'fast-sass-loader'
            ]
        }
    ];
};
