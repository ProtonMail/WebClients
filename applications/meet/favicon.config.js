const path = require('path');

const url = 'https://meet.proton.me/';

module.exports = {
    logo: path.resolve('./src/favicon.svg'),
    logoMaskable: path.resolve('./src/icon-maskable.svg'),
    favicons: {
        appName: 'Proton Meet',
        appDescription:
            'Proton Meet is a video conferencing tool that brings industry-leading encryption to your online calls, ensuring your most sensitive meetings remain private.',
    },
    url,
    locales: Object.keys(require('./locales/config/locales.json')),
};
