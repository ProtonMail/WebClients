const { excludeNodeModulesExcept, excludeFiles, createRegex } = require('./helpers/regex');
const { BABEL_EXCLUDE_FILES, BABEL_INCLUDE_NODE_MODULES } = require('./constants');

const BABEL_PLUGINS_PRODUCTION = [['babel-plugin-transform-react-remove-prop-types', { removeImport: true }]];

module.exports = ({ isProduction, isTranspile = true }, flow) => {
    const TRANSPILE_JS_LOADER = [
        {
            loader: 'babel-loader',
            options: {
                cacheDirectory: true,
                cacheCompression: isProduction,
                compact: isProduction,
                presets: [
                    [
                        '@babel/preset-env',
                        {
                            targets: {
                                browsers: ['ie 11']
                            },
                            useBuiltIns: 'entry',
                            exclude: ['transform-typeof-symbol'] // Exclude transforms that make all code slower
                        }
                    ],
                    [
                        '@babel/preset-react',
                        {
                            // Adds component stack to warning messages
                            // Adds __self attribute to JSX which React will use for some warnings
                            development: !isProduction
                        }
                    ]
                ],
                plugins: [
                    '@babel/plugin-syntax-dynamic-import',
                    '@babel/plugin-proposal-object-rest-spread',
                    ['@babel/plugin-proposal-class-properties', { loose: true }],
                    require('babel-plugin-lodash'),
                    '@babel/plugin-transform-runtime',
                    ...(isProduction ? BABEL_PLUGINS_PRODUCTION : ['react-hot-loader/babel'])
                ]
            }
        }
    ];

    if (flow === 'i18n') {
        TRANSPILE_JS_LOADER[0].options.plugins.push([
            'ttag',
            {
                extract: {
                    output: 'i18n/template.pot'
                }
            }
        ]);
        return [
            {
                test: /\.js$/,
                exclude: createRegex(
                    excludeNodeModulesExcept(BABEL_INCLUDE_NODE_MODULES),
                    excludeFiles(BABEL_EXCLUDE_FILES)
                ),
                use: TRANSPILE_JS_LOADER
            }
        ];
    }

    return [
        {
            test: /\.js$/,
            use: ['source-map-loader'],
            enforce: 'pre'
        },
        {
            test: /\.js$/,
            exclude: createRegex(
                excludeNodeModulesExcept(BABEL_INCLUDE_NODE_MODULES),
                excludeFiles(BABEL_EXCLUDE_FILES)
            ),
            use: !isTranspile ? ['source-map-loader'] : TRANSPILE_JS_LOADER
        }
    ];
};
