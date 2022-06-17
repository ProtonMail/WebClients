module.exports = {
    logo: 'public/assets/favicon.svg',
    favicons: {
        appName: 'Proton Drive',
        appDescription:
            'Proton Drive allows you to securely store and share your sensitive documents and access them anywhere.',
    },
    url: 'https://drive.proton.me/',
    locales: Object.keys(require('./locales/config/locales.json')),
};
