const path = require('path');

module.exports = {
    logo: path.resolve('./src/favicon.svg'),
    favicons: {
        appName: 'Proton VPN',
        appDescription:
            'Proton VPN is a security focused FREE VPN service, developed by CERN and MIT scientists. Use the web anonymously, unblock websites & encrypt your connection.',
    },
    url: 'https://account.protonvpn.com/',
    locales: Object.keys(require('./locales/config/locales.json')),
};
