const MAX_SIZE = 24 * 1024;

module.exports = [
    {
        test: /\.(jpg|jpeg|gif|svg)$/,
        use: [
            {
                loader: 'file-loader',
                options: {
                    name: '[name].[ext]',
                    outputPath: 'assets/img/'
                }
            }
        ]
    },
    {
        test: /\.png$/,
        use: [
            {
                loader: 'file-loader',
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
                loader: 'file-loader',
                options: {
                    limit: MAX_SIZE,
                    name: 'assets/fonts/[name].[ext]',
                    mimetype: 'application/font-woff'
                }
            }
        ]
    },
    {
        test: /\.(ttf|eot)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: [
            {
                loader: 'file-loader',
                options: {
                    limit: MAX_SIZE,
                    name: 'assets/fonts/[name].[ext]'
                }
            }
        ]
    }
];
