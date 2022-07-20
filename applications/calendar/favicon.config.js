const path = require('path');

module.exports = {
    logo: path.resolve('./src/favicon.svg'),
    favicons: {
        appName: 'Proton Calendar',
        appDescription:
            'Proton Calendar helps you stay on top of your schedule while protecting your data. Apps available for Android, iOS, and the web.',
    },
    url: 'https://calendar.proton.me/',
    locales: Object.keys(require('./locales/config/locales.json')),
};
