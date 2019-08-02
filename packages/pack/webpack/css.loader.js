const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const postcssPresetEnv = require('postcss-preset-env');

const DESIGN_SYSTEM_THEME = /.*theme\.scss$/;

// Set up the variables to the design system so that files are resolved properly.
const PREPEND_SASS = `
$path-images: "~design-system/assets/img/shared/";
`;

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
        'css-loader',
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
            loader: 'fast-sass-loader',
            options: {
                data: PREPEND_SASS
            }
        }
    ].filter(Boolean);
};

module.exports = ({ isProduction }) => {
    const sassLoaders = getSassLoaders(isProduction);
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
            exclude: DESIGN_SYSTEM_THEME,
            use: ['css-hot-loader', MiniCssExtractPlugin.loader, ...sassLoaders]
        },
        {
            test: DESIGN_SYSTEM_THEME,
            // Prevent loading the theme in <style>, we want to load it as a raw string
            use: [...sassLoaders]
        }
    ];
};
