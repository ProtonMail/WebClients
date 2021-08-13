const DESIGN_SYSTEM_ICONS_SVG = 'sprite-icons.svg|mime-icons.svg|file-icons.svg';
const DESIGN_SYSTEM_CSS_SVG = 'sprite-for-css-only.svg';

module.exports = () => [
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
                type: 'asset/source',
            },
            {
                test: /\.(bmp|png|jpg|jpeg|gif|svg)$/,
                type: 'asset',
                exclude: new RegExp(`${DESIGN_SYSTEM_CSS_SVG}`),
            },
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/,
                type: 'asset/resource',
            },
            {
                test: /\.md$/,
                type: 'asset/source',
            },
        ],
    },
];
