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
                loader: 'svgo-loader',
                options: {
                    plugins: [],
                },
            },
            {
                test: /\.(bmp|png|jpg|jpeg|gif|svg)$/,
                type: 'asset',
                exclude: new RegExp(`${DESIGN_SYSTEM_CSS_SVG}`),
                parser: {
                    dataUrlCondition: (source, { filename }) => {
                        // Don't inline the asset into a data url if the filename includes favicon, or if the size is greater than 4 KB
                        return filename.includes('favicon') ? false : Buffer.byteLength(source) <= 4 * 1024; // 4KB;
                    },
                },
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
