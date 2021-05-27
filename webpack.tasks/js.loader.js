const env = require('../env/config');
const { babel } = require('../env/conf.build');
const getRegex = require('./helpers/babel');

const hasTranspile = !('transpile' in env.argv);

/**
 * Mode no transpilation is available for Chrome/Firefox
 * Default always transpile
 */
const jsLoader = () => {
    const list = ['source-map-loader'];

    if (!hasTranspile) {
        return list;
    }

    list.push({
        loader: 'babel-loader',
        options: {
            cacheDirectory: true,
            presets: [
                [
                    '@babel/preset-env',
                    {
                        targets: {
                            browsers: ['ie 11', 'safari 11']
                        },
                        useBuiltIns: 'entry',
                        corejs: { version: '3.13' }
                    }
                ]
            ],
            plugins: [
                require('@babel/plugin-syntax-dynamic-import'),
                require('@babel/plugin-proposal-object-rest-spread'),
                require('@babel/plugin-transform-runtime')
            ],
            env: {
                dev: {
                    plugins: [require('babel-plugin-lodash')]
                },
                dist: {
                    plugins: [require('babel-plugin-angularjs-annotate'), require('babel-plugin-lodash')]
                },
                test: {
                    plugins: [require('babel-plugin-istanbul')]
                }
            }
        }
    });
    return list;
};

const pipe = [
    {
        test: /\.js$/,
        use: ['source-map-loader'],
        enforce: 'pre'
    },
    {
        test: /\.js$/,
        exclude: getRegex(babel.includedNodeModules, babel.excludedFiles),
        use: jsLoader()
    },
    {
        test: /\.js$/,
        loader: 'string-replace-loader',
        query: {
            multiple: [
                {
                    search: '#hostURL#',
                    replace: env.getHostURL()
                },
                {
                    search: '#hostURL2#',
                    replace: env.getHostURL(true)
                }
            ]
        }
    }
];

if (process.env.NODE_ENV !== 'test') {
    pipe.unshift({
        test: /\.js$/,
        use: ['source-map-loader'],
        enforce: 'pre'
    });
}

module.exports = pipe;
