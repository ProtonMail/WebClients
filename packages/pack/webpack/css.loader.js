const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const RAW_TEXT = /.*\.theme\.css|\.raw\.scss$/;

const handleUrlResolve = (url) => {
    // Transparent image, included through write
    if (url.includes('host.png')) {
        return false;
    }
    return true;
};

module.exports = ({ browserslist, noLogicalScss }) => {
    const plugins = [
        require('autoprefixer')({
            overrideBrowserslist: browserslist,
            flexbox: 'no-2009',
        }),
        require('postcss-color-functional-notation')(),
    ];

    if (noLogicalScss) {
        plugins.push(require('postcss-logical')());
    }

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
                    plugins,
                },
            },
        },
        {
            loader: require.resolve('sass-loader'),
            options: {
                implementation: require('sass'),
                sassOptions: {
                    outputStyle: 'compressed',
                    /** Dart Sass prepends a UTF-8 BOM to any compressed module whose output
                     * contains non-ASCII (sass-loader forces `style: 'compressed'` in
                     * production, so this only bites prod builds). postcss >=8.5.20 preserves
                     * that BOM where older versions silently dropped it, so once
                     * mini-css-extract concatenates the modules the BOMs sit mid-file, and
                     * esbuild escapes them into the following selector — `\feff body:before`
                     * never matches, which silently breaks useActiveBreakpoint. Nothing
                     * downstream needs the declaration: esbuild escapes non-ASCII to ASCII. */
                    charset: false,
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
