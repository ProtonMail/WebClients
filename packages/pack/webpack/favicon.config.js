const offsetIcon = {
    offset: 15,
    background: false,
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
    manifestMaskable: true,
    icons: {
        android: offsetIcon,
        appleIcon: {
            offset: 15,
            background: '#fff',
        },
        appleStartup: false,
        // Only interested in the .ico file, not the custom 16x16, 32x32 pngs it generates
        // because we default to a .svg favicon (with our own custom implementation because
        // the favicons library (6.x) doesn't support it by default)
        favicons: ['favicon.ico'],
        windows: offsetIcon,
        yandex: offsetIcon,
    },
};
