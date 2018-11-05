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
            presets: ['env'],
            plugins: [require('babel-plugin-transform-object-rest-spread')],
            env: {
                dev: {
                    plugins: [require('babel-plugin-lodash')]
                },
                dist: {
                    plugins: [require('babel-plugin-angularjs-annotate'), require('babel-plugin-lodash')]
                },
                test: {
                    plugins: ['istanbul']
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
        exclude: /node_modules/,
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
