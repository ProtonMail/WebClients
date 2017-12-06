const env = require('../env/config');

const pipe = [
    {
        test: /\.js$/,
        use: ['source-map-loader'],
        enforce: 'pre'
    },
    {
        test: /\.js$/,
        exclude: /(node_modules|vendor|src\/librairies)/,
        use: [
            {
                loader: 'babel-loader',
                options: {
                    cacheDirectory: true,
                    presets: ['es2017'],
                    plugins: [require('babel-plugin-transform-object-rest-spread'), require('babel-plugin-transform-runtime')],
                    env: {
                        dist: {
                            plugins: [require('babel-plugin-angularjs-annotate')]
                        },
                        test: {
                            plugins: [require('babel-plugin-istanbul')]
                        }
                    }
                }
            }
        ]
    }
];

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
