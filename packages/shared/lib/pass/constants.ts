interface Client {
    title: string;
    link: string;
    icon:
        | 'brand-chrome'
        | 'brand-android'
        | 'brand-apple'
        | 'brand-brave'
        | 'brand-firefox'
        | 'brand-edge'
        | 'brand-windows'
        | 'brand-mac'
        | 'brand-linux'
        | 'brand-safari'
        | 'window-terminal';
}

export enum Clients {
    Windows,
    macOS,
    Linux,
    Android,
    iOS,
    Chrome,
    Brave,
    Firefox,
    Edge,
    Safari,
    CLI,
}

export const clients: { [key in Clients]: Client } = {
    [Clients.Windows]: {
        title: 'Windows',
        link: 'https://proton.me/download/PassDesktop/win32/x64/ProtonPass_Setup.exe',
        icon: 'brand-windows',
    },
    [Clients.macOS]: {
        title: 'macOS',
        link: 'https://proton.me/download/pass/macos/ProtonPass.dmg',
        icon: 'brand-mac',
    },
    [Clients.Linux]: {
        title: 'Linux',
        link: 'https://proton.me/support/set-up-proton-pass-linux',
        icon: 'brand-linux',
    },
    [Clients.Android]: {
        title: 'Android',
        link: 'https://play.google.com/store/apps/details?id=proton.android.pass',
        icon: 'brand-android',
    },
    [Clients.iOS]: {
        title: 'iOS',
        link: 'https://apps.apple.com/us/app/id6443490629',
        icon: 'brand-apple',
    },
    [Clients.Chrome]: {
        title: 'Chrome',
        link: 'https://chrome.google.com/webstore/detail/proton-pass/ghmbeldphafepmbegfdlkpapadhbakde',
        icon: 'brand-chrome',
    },
    [Clients.Brave]: {
        title: 'Brave',
        link: 'https://chrome.google.com/webstore/detail/proton-pass/ghmbeldphafepmbegfdlkpapadhbakde',
        icon: 'brand-brave',
    },
    [Clients.Edge]: {
        title: 'Edge',
        link: 'https://microsoftedge.microsoft.com/addons/detail/proton-pass-free-passwor/gcllgfdnfnllodcaambdaknbipemelie',
        icon: 'brand-edge',
    },
    [Clients.Firefox]: {
        title: 'Firefox',
        link: 'https://addons.mozilla.org/en-US/firefox/addon/proton-pass',
        icon: 'brand-firefox',
    },
    [Clients.Safari]: {
        title: 'Safari',
        link: 'https://apps.apple.com/app/id6502835663',
        icon: 'brand-safari',
    },
    [Clients.CLI]: {
        title: 'Command line interface',
        link: 'https://protonpass.github.io/pass-cli/',
        icon: 'window-terminal',
    },
} as const;
