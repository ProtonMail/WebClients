const MAX_SIZE = 24 * 1024;

module.exports = [
    {
        test: /\.(png|jpg|gif)$/,
        use: [
            {
                loader: 'file-loader',
                options: {
                    name: 'assets/img/[name].[ext]'
                }
            }
        ]
    },
    {
        test: /\.png$/,
        use: [
            {
                loader: 'url-loader',
                options: {
                    limit: MAX_SIZE,
                    name: 'assets/img/[name].[ext]',
                    mimetype: 'image/png'
                }
            }
        ]
    },
    {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: [
            {
                loader: 'url-loader',
                options: {
                    limit: MAX_SIZE,
                    name: 'assets/fonts/[name].[ext]',
                    mimetype: 'application/font-woff'
                }
            }
        ]
    },
    {
        test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: [
            {
                loader: 'url-loader',
                options: {
                    limit: MAX_SIZE,
                    name: 'assets/fonts/[name].[ext]'
                }
            }
        ]
    }
];
