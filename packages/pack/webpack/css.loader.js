const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const postcssPresetEnv = require('postcss-preset-env');
const fs = require('fs');
const { getSource } = require('./helpers/source');

const DESIGN_SYSTEM_THEME = /.*theme\.scss$/;

const SASS_VARIABLES_FILEPATH = getSource('src/app/variables.scss');
const SASS_VARIABLES = fs.existsSync(SASS_VARIABLES_FILEPATH) ? fs.readFileSync(SASS_VARIABLES_FILEPATH) : '';
// Set up the variables to the design system so that files are resolved properly.
const PREPEND_SASS = `
$path-images: "~design-system/assets/img/shared/";
${SASS_VARIABLES}
`;

const handleUrlResolve = (url) => {
    // Transparent image, included through write
    if (url.includes('host.png')) {
        return false;
    }
    return true;
};

const getSassLoaders = (isProduction) => {
    const postcssPlugins = isProduction
        ? [
              postcssPresetEnv({
                  autoprefixer: {
                      flexbox: 'no-2009'
                  },
                  stage: 3
              })
          ]
        : [];

    return [
        {
            loader: 'css-loader',
            options: {
                url: handleUrlResolve
            }
        },
        // To get rid of "You did not set any plugins, parser, or stringifier. Right now, PostCSS does nothing."
        postcssPlugins.length
            ? {
                  loader: 'postcss-loader',
                  options: {
                      ident: 'postcss',
                      plugins: postcssPlugins,
                      sourceMap: isProduction
                  }
              }
            : undefined,
        {
            loader: 'sass-loader',
            options: {
                additionalData: PREPEND_SASS
            }
        }
    ].filter(Boolean);
};

module.exports = ({ isProduction }) => {
    const sassLoaders = getSassLoaders(isProduction);
    const miniLoader = {
        loader: MiniCssExtractPlugin.loader,
        options: {
            hmr: !isProduction
        }
    };
    return [
        {
            test: /\.css$/,
            use: [
                miniLoader,
                {
                    loader: 'css-loader',
                    options: {
                        importLoaders: 1,
                        url: handleUrlResolve
                    }
                }
            ],
            sideEffects: true
        },
        {
            test: /\.scss$/,
            exclude: DESIGN_SYSTEM_THEME,
            use: [miniLoader, ...sassLoaders],
            sideEffects: true
        },
        {
            test: DESIGN_SYSTEM_THEME,
            // Prevent loading the theme in <style>, we want to load it as a raw string
            use: [...sassLoaders]
        }
    ];
};
