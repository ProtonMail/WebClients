const LIMIT = 10000;
const DESIGN_SYSTEM_SVG = /sprite-icons.svg$/;

module.exports = () => [
    {
        test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
        loader: 'url-loader',
        options: {
            limit: LIMIT,
            name: 'assets/img/[name].[hash:8].[ext]'
        }
    },
    {
        test: DESIGN_SYSTEM_SVG,
        use: [
            {
                loader: 'svg-inline-loader'
            }
        ]
    },
    {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        exclude: DESIGN_SYSTEM_SVG,
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
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        use: [
            {
                loader: 'file-loader',
                options: {
                    name: 'assets/fonts/[name].[ext]'
                }
            }
        ]
    },
    {
        test: /\.po$/,
        use: [{ loader: 'json-loader' }, { loader: 'po-gettext-loader' }]
    }
];
