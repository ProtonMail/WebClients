const path = require('path');

const url = 'https://lumo.proton.me/';

module.exports = {
    logo: path.resolve('./public/favicon.png'),
    logoMaskable: path.resolve('./public/favicon.png'),
    favicons: {
        appName: 'Lumo: Privacy-first AI assistant where chats stay confidential',
        appDescription: 'Meet Lumo, the zero-access encrypted AI assistant by Proton that does not track or record your conversations. Ask me anything — it\'s confidential',
    },
    url,
    ogImage: `${url}images/social/lumo-og.png`,
};
