const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const fs = require('fs');
const path = require('path');

const DESIGN_SYSTEM_THEME = /.*theme\.scss$/;

const SASS_VARIABLES_FILEPATH = path.resolve('./src/app/variables.scss');
const SASS_VARIABLES = fs.existsSync(SASS_VARIABLES_FILEPATH) ? fs.readFileSync(SASS_VARIABLES_FILEPATH) : '';
// Set up the variables to the design system so that files are resolved properly.
const PREPEND_SASS = `
$path-images: "~@proton/styles/assets/img/shared/";
${SASS_VARIABLES}
`;

const handleUrlResolve = (url) => {
    // Transparent image, included through write
    if (url.includes('host.png')) {
        return false;
    }
    return true;
};

module.exports = ({ browserslist }) => {
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
                        require('postcss-color-functional-notation'),
                    ],
                },
            },
        },
        {
            loader: require.resolve('resolve-url-loader'),
        },
        {
            loader: require.resolve('sass-loader'),
            options: {
                additionalData: PREPEND_SASS,
            },
        },
    ].filter(Boolean);

    const miniLoader = {
        loader: MiniCssExtractPlugin.loader,
    };

    return [
        {
            test: /\.css$/,
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
            exclude: DESIGN_SYSTEM_THEME,
            use: [miniLoader, ...sassLoaders],
            sideEffects: true,
        },
        {
            test: DESIGN_SYSTEM_THEME,
            // Prevent loading the theme in <style>, we want to load it as a raw string
            use: [...sassLoaders],
        },
    ];
};
