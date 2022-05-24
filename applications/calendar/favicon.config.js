module.exports = {
    logo: 'src/assets/favicon-calendar-static-32.svg',
    favicons: {
        appName: 'Proton Calendar',
        appDescription:
            'Proton Calendar helps you stay on top of your schedule while protecting your data. Apps available for Android, iOS, and the web.',
    },
    url: 'https://calendar.proton.me/',
    locales: Object.keys(require('./locales/config/locales.json')),
};
