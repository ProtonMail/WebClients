const DESIGN_SYSTEM_ICONS_SVG = 'sprite-icons.svg|file-icons.svg';

module.exports = ({ inlineIcons } = { inlineIcons: false }) => [
    {
        /**
         * oneOf allows to take the first match instead of all matches, .e.g
         *
         * without one of:
         *
         * sprite-icons.svg -> [svg-inline-loader, url-loader, file-loader]
         * img-1.svg -> [url loader, file loader]
         * design-system-icon.svg -> file loader
         *
         * with one of:
         *
         * sprite-icons.svg -> svg-inline-loader
         * img-1.svg -> url loader
         * design-system-icon.svg -> file loader
         */
        oneOf: [
            {
                test: new RegExp(`${DESIGN_SYSTEM_ICONS_SVG}$`),
                type: inlineIcons ? 'asset/source' : 'asset/resource',
                loader: 'svgo-loader',
                options: {
                    plugins: ['removeComments'],
                },
            },
            {
                test: /\.(bmp|png|jpg|jpeg|gif|svg)$/,
                type: 'asset/resource',
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf|mp4|webm|pdf|csv)$/,
                type: 'asset/resource',
            },
            {
                test: /\.md$/,
                type: 'asset/source',
            },
        ],
    },
];
