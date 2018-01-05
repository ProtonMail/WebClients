const env = require('../env/config');

const pipe = [
    {
        test: /\.js$/,
        exclude: /(node_modules|vendor|src\/librairies)/,
        use: [
            {
                loader: 'babel-loader',
                options: {
                    cacheDirectory: true,
                    presets: [
                        [
                            'env',
                            {
                                targets: {
                                    browsers: ['last 2 version', 'ie 11']
                                }
                            }
                        ]
                    ],
                    plugins: [require('babel-plugin-transform-object-rest-spread'), require('babel-plugin-transform-runtime')],
                    env: {
                        dist: {
                            plugins: [require('babel-plugin-angularjs-annotate')]
                        },
                        test: {
                            plugins: ['istanbul']
                        }
                    }
                }
            }
        ]
    }
];

if (process.env.NODE_ENV !== 'test') {
    pipe.unshift({
        test: /\.js$/,
        use: ['source-map-loader'],
        enforce: 'pre'
    });
}

if (env.isDistRelease()) {
    pipe.push({
        test: /\.js$/,
        loader: 'string-replace-loader',
        query: {
            search: 'NODE_ENV',
            replace: env.getEnv()
        }
    });
}

module.exports = pipe;
