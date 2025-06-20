const { purgeCSSPlugin } = require('@fullhuman/postcss-purgecss');

const config = {
    plugins: [
        purgeCSSPlugin({
            content: ['./**/*.html'],
            safelist: ['iframe', 'card-input--one-line', 'card-input--two-line', 'icon-error'],
        }),
    ],
};

module.exports = config;
