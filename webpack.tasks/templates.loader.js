const env = require('../env/config');

module.exports = [
    {
        test: /\.tpl\.html$/,
        use: [
            {
                loader: 'ngtemplate-loader',
                options: {
                    module: 'templates-app',
                    relativeTo: 'templates/',
                    prefix: 'templates',
                    root: 'assets'
                }
            }
        ]
    },

    {
        test: /\.html$/,
        use: [
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
