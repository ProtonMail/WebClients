const offsetIcon = {
    offset: 15,
    background: '#fff',
};

module.exports = {
    developerName: 'Proton AG',
    developerURL: 'https://github.com/ProtonMail/WebClients',
    background: '#fff',
    theme_color: '#1b1340',
    appleStatusBarStyle: 'default',
    display: 'standalone',
    start_url: '/',
    loadManifestWithCredentials: true,
    icons: {
        android: offsetIcon,
        appleIcon: offsetIcon,
        appleStartup: false,
        favicons: true,
        windows: offsetIcon,
        yandex: offsetIcon,
    },
};
