const path = require('path');

const url = 'https://pass.proton.me/';

module.exports = {
    logo: path.resolve('./src/favicon.svg'),
    // TODO provide real maskable icon
    logoMaskable: path.resolve('./src/favicon.svg'),
    favicons: {
        appName: 'Proton Pass Web App',
        appDescription:
            'Proton Pass is an open source, end-to-end encrypted password manager app. Create and store passwords, email aliases, 2FA codes, and notes on all your devices',
    },
    url,
    ogImage: `${url}assets/proton-og-image.png`,
    // locales: Object.keys(require('./locales/config/locales.json')),
};
