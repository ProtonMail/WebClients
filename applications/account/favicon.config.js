const path = require('path');

const url = 'https://account.proton.me/';

module.exports = {
    logo: path.resolve('./src/favicon.svg'),
    logoMaskable: path.resolve('./src/icon-maskable.svg'),
    favicons: {
        appName: 'Proton',
        appDescription:
            'Our encrypted services let you control who has access to your emails, plans, files, and online activity. Free plans are available.',
    },
    url,
    ogImage: `${url}assets/proton-og-image.png`,
    locales: Object.keys(require('./locales/config/locales.json')),
};
