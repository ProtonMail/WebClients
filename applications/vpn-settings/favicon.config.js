module.exports = {
    logo: 'public/assets/favicon.svg',
    favicons: {
        appName: 'Proton VPN',
        appDescription:
            'Proton VPN is a security focused FREE VPN service, developed by CERN and MIT scientists. Use the web anonymously, unblock websites & encrypt your connection.',
    },
    url: 'https://account.protonvpn.com/',
    locales: Object.keys(require('./locales/config/locales.json')),
};
