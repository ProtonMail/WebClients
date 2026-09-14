const path = require('path');

const url = 'https://console.proton.me/';

module.exports = {
    logo: path.resolve('./src/favicon.svg'),
    logoMaskable: path.resolve('./src/icon-maskable.svg'),
    favicons: {
        appName: 'Proton Console',
        appDescription: 'Proton Console.',
    },
    url,
    ogImage: `${url}assets/proton-og-image.png`,
    locales: [],
};
