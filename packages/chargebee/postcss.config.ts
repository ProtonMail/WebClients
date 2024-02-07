const purgecss = require('@fullhuman/postcss-purgecss');

const config = {
    plugins: [
        purgecss({
            content: ['./**/*.html'],
            safelist: ['iframe', 'card-input--one-line', 'card-input--two-line', 'icon-error'],
        }),
    ],
};

module.exports = config;
