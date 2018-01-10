const env = require('../env/config');

const pipe = [
    {
        test: /\.js$/,
        use: ['source-map-loader'],
        enforce: 'pre'
    },
    {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
            'source-map-loader',
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
                    plugins: [
                        require('babel-plugin-transform-object-rest-spread'),
                        require('babel-plugin-transform-runtime'),
                        require('babel-plugin-lodash')
                    ],
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
