const LIMIT = 10000;

module.exports = () => [
    {
        test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
        loader: 'url-loader',
        options: {
            limit: LIMIT,
            name: 'assets/img/[name].[hash:8].[ext]',
        },
    },
    {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        use: [
            {
                loader: 'file-loader',
                options: {
                    name: 'assets/img/[name].[ext]',
                }
            }
        ]
    },
    {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: [
            {
                loader: 'file-loader',
                options: {
                    name: 'assets/fonts/[name].[ext]',
                }
            }
        ]
    },
    {
        test: /\.po$/,
        use: [
            { loader: 'json-loader' },
            { loader: 'po-gettext-loader' }
        ]
    }
];
