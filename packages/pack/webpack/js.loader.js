const { excludeNodeModulesExcept, excludeFiles, createRegex } = require('./helpers/regex');
const { BABEL_EXCLUDE_FILES, BABEL_INCLUDE_NODE_MODULES } = require('./constants');

const BABEL_PLUGINS_PRODUCTION = [['babel-plugin-transform-react-remove-prop-types', { removeImport: true }]];

const UNSUPPORTED_JS_LOADER = [
    {
        loader: 'babel-loader',
        options: {
            cacheDirectory: true,
            cacheCompression: true,
            compact: true,
            presets: [
                [
                    '@babel/preset-env',
                    {
                        targets: { browsers: ['ie 11'] },
                        useBuiltIns: 'entry',
                        corejs: 3
                    }
                ]
            ],
            plugins: []
        }
    }
];

module.exports = ({ isProduction }, flow) => {
    const TRANSPILE_JS_LOADER = [
        {
            loader: 'babel-loader',
            options: {
                cacheDirectory: true,
                cacheCompression: isProduction,
                compact: isProduction,
                presets: [
                    ['@babel/preset-typescript'],
                    [
                        '@babel/preset-env',
                        {
                            targets: {
                                browsers: isProduction
                                    ? [
                                          // TODO: Only browsers that support es6
                                          '> 0.5%, not IE 11, Firefox ESR'
                                      ]
                                    : ['last 1 chrome version', 'last 1 firefox version', 'last 1 safari version']
                            },
                            useBuiltIns: 'entry',
                            corejs: 3,
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
                    '@babel/plugin-proposal-nullish-coalescing-operator',
                    '@babel/plugin-proposal-optional-chaining',
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
                test: /\.js$|\.tsx?$/,
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
            test: /\.js$|\.tsx?$/,
            use: ['source-map-loader'],
            enforce: 'pre'
        },
        {
            test: /unsupported\.(js|tsx?)$/,
            use: UNSUPPORTED_JS_LOADER
        },
        {
            test: /\.js$|\.tsx?$/,
            exclude: createRegex(
                excludeNodeModulesExcept(BABEL_INCLUDE_NODE_MODULES),
                excludeFiles([...BABEL_EXCLUDE_FILES, 'unsupported.js'])
            ),
            use: TRANSPILE_JS_LOADER
        }
    ];
};
