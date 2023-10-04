const path = require('path');

const url = 'https://calendar.proton.me/';

module.exports = {
    logo: path.resolve('./src/favicon.svg'),
    logoMaskable: path.resolve('./src/icon-maskable.svg'),
    favicons: {
        appName: 'Proton Calendar',
        appDescription:
            'Proton Calendar helps you stay on top of your schedule while protecting your data. Apps available for Android, iOS, and the web.',
    },
    url,
    ogImage: `${url}assets/proton-og-image.png`,
    locales: Object.keys(require('./locales/config/locales.json')),
};
