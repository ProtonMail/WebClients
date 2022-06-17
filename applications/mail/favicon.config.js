module.exports = {
    logo: 'public/assets/favicon.svg',
    favicons: {
        appName: 'Proton Mail',
        appDescription:
            'Proton Mail is based in Switzerland and uses advanced encryption to keep your data safe. Apps available for Android, iOS, and desktop devices.',
    },
    url: 'https://mail.proton.me/',
    locales: Object.keys(require('./locales/config/locales.json')),
};
