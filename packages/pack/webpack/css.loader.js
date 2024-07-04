const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const RAW_TEXT = /.*\.theme\.css|\.raw\.scss$/;

const handleUrlResolve = (url) => {
    // Transparent image, included through write
    if (url.includes('host.png')) {
        return false;
    }
    return true;
};

module.exports = ({ browserslist, logical }) => {
    const sassLoaders = [
        {
            loader: require.resolve('css-loader'),
            options: {
                url: { filter: handleUrlResolve },
            },
        },
        {
            loader: require.resolve('postcss-loader'),
            options: {
                postcssOptions: {
                    plugins: [
                        require('autoprefixer')({
                            overrideBrowserslist: browserslist,
                            flexbox: 'no-2009',
                        }),
                        require('postcss-color-functional-notation')(),
                        !logical && require('postcss-logical')(),
                    ].filter(Boolean),
                },
            },
        },
        {
            loader: require.resolve('sass-loader'),
            options: {
                implementation: require('sass'),
                sassOptions: {
                    outputStyle: 'compressed',
                },
            },
        },
    ].filter(Boolean);

    const miniLoader = {
        loader: MiniCssExtractPlugin.loader,
    };

    return [
        {
            test: /\.css$/,
            exclude: /.*\.theme\.css/,
            use: [
                miniLoader,
                {
                    loader: require.resolve('css-loader'),
                    options: {
                        importLoaders: 1,
                        url: { filter: handleUrlResolve },
                    },
                },
            ],
            sideEffects: true,
        },
        {
            test: /\.scss$/,
            exclude: RAW_TEXT,
            use: [miniLoader, ...sassLoaders],
            sideEffects: true,
        },
        {
            test: RAW_TEXT,
            // Prevent loading the theme in <style>, we want to load it as a raw string
            use: [...sassLoaders],
        },
    ];
};
