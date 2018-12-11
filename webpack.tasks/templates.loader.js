const path = require('path');
const env = require('../env/config');

module.exports = [
    {
        test: /\.tpl\.html$/,
        use: [
            {
                loader: 'ngtemplate-loader',
                options: {
                    module: 'templates-app',
                    relativeTo: path.resolve(__dirname, '../src/templates'),
                    prefix: 'templates',
                    root: 'assets'
                }
            },
            {
                loader: 'html-loader',
                options: {
                    minimize: env.isDistRelease(),
                    root: 'assets',
                    attrs: false
                }
            }
        ]
    }
];
