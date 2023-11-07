const path = require('path');

const url = 'https://pass.proton.me/';

module.exports = {
    logo: path.resolve('./src/favicon.svg'),
    favicons: {
        appName: 'Proton Pass Web',
        appDescription: 'Proton Pass web is comming soon!',
    },
    url,
    ogImage: `${url}assets/proton-og-image.png`,
    //locales: Object.keys(require('./locales/config/locales.json')),
};
