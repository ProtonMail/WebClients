const path = require('path');

const url = 'https://meet.proton.me/';

module.exports = {
    logo: path.resolve('./src/favicon.png'),
    // TODO provide real maskable icon
    logoMaskable: path.resolve('./src/favicon.png'),
    favicons: {
        appName: 'Proton Meet',
        appDescription: 'Proton Meet',
    },
    url,
};
