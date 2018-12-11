const env = require('../env/config');

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
                    '@babel/env',
                    {
                        targets: {
                            browsers: ['ie 11']
                        },
                        useBuiltIns: 'entry'
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
        exclude: /(\/node_modules\/(?!(asmcrypto\.js|pmcrypto|sieve\.js)))|mailparser\.js/,
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
