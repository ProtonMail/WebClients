const path = require('path');

const url = 'https://docs.proton.me/';

module.exports = {
    // TODO: use real images, copied those from Drive for now
    logo: path.resolve('./src/favicon.svg'),
    logoMaskable: path.resolve('./src/icon-maskable.svg'),
    favicons: {
        appName: 'Proton Docs',
        // TODO: get real description from product
        appDescription: 'Edit documents in real time, fully end-to-end encrypted.',
    },
    url,
    ogImage: `${url}assets/proton-og-image.png`,
    locales: Object.keys(require('./locales/config/locales.json')),
};
