module.exports = () => [
    {
        /**
         * oneOf takes the first matching rule instead of applying every match.
         */
        oneOf: [
            {
                test: /\.(bmp|png|jpg|jpeg|gif|svg|webp)$/,
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
