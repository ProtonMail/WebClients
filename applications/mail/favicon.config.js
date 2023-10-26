const path = require('path');

const url = 'https://mail.proton.me/';

module.exports = {
    logo: path.resolve('./src/favicon.svg'),
    logoMaskable: path.resolve('./src/icon-maskable.svg'),
    favicons: {
        appName: 'Proton Mail',
        appDescription:
            'Proton Mail is based in Switzerland and uses advanced encryption to keep your data safe. Apps available for Android, iOS, and desktop devices.',
    },
    url,
    ogImage: `${url}assets/proton-og-image.png`,
    locales: Object.keys(require('./locales/config/locales.json')),
};
