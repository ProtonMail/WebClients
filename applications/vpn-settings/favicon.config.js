const path = require('path');

const url = 'https://account.protonvpn.com/';

module.exports = {
    logo: path.resolve('./src/favicon.svg'),
    logoMaskable: path.resolve('./src/icon-maskable.svg'),
    favicons: {
        appName: 'Proton VPN',
        appDescription:
            'Proton VPN is a security focused FREE VPN service, developed by CERN and MIT scientists. Use the web anonymously, unblock websites & encrypt your connection.',
    },
    url,
    ogImage: `${url}assets/proton-og-image.png`,
    locales: Object.keys(require('./locales/config/locales.json')),
};
