import type { IconComponent } from '@proton/icons/component';
import { IcBrandAndroid } from '@proton/icons/icons/IcBrandAndroid';
import { IcBrandApple } from '@proton/icons/icons/IcBrandApple';
import { IcBrandBrave } from '@proton/icons/icons/IcBrandBrave';
import { IcBrandChrome } from '@proton/icons/icons/IcBrandChrome';
import { IcBrandEdge } from '@proton/icons/icons/IcBrandEdge';
import { IcBrandFirefox } from '@proton/icons/icons/IcBrandFirefox';
import { IcBrandLinux } from '@proton/icons/icons/IcBrandLinux';
import { IcBrandMac } from '@proton/icons/icons/IcBrandMac';
import { IcBrandSafari } from '@proton/icons/icons/IcBrandSafari';
import { IcBrandWindows } from '@proton/icons/icons/IcBrandWindows';
import { IcWindowTerminal } from '@proton/icons/icons/IcWindowTerminal';

import { Clients } from './constants';

export interface Client {
    title: string;
    link: string;
    icon: IconComponent;
}

export const clients: { [key in Clients]: Client } = {
    [Clients.Windows]: {
        title: 'Windows',
        link: 'https://proton.me/download/pass/windows/ProtonPass.msix',
        icon: IcBrandWindows,
    },
    [Clients.macOS]: {
        title: 'macOS',
        link: 'https://proton.me/download/pass/macos/ProtonPass.dmg',
        icon: IcBrandMac,
    },
    [Clients.Linux]: {
        title: 'Linux',
        link: 'https://proton.me/support/set-up-proton-pass-linux',
        icon: IcBrandLinux,
    },
    [Clients.Android]: {
        title: 'Android',
        link: 'https://play.google.com/store/apps/details?id=proton.android.pass',
        icon: IcBrandAndroid,
    },
    [Clients.iOS]: {
        title: 'iOS',
        link: 'https://apps.apple.com/us/app/id6443490629',
        icon: IcBrandApple,
    },
    [Clients.Chrome]: {
        title: 'Chrome',
        link: 'https://chrome.google.com/webstore/detail/proton-pass/ghmbeldphafepmbegfdlkpapadhbakde',
        icon: IcBrandChrome,
    },
    [Clients.Brave]: {
        title: 'Brave',
        link: 'https://chrome.google.com/webstore/detail/proton-pass/ghmbeldphafepmbegfdlkpapadhbakde',
        icon: IcBrandBrave,
    },
    [Clients.Edge]: {
        title: 'Edge',
        link: 'https://microsoftedge.microsoft.com/addons/detail/proton-pass-free-passwor/gcllgfdnfnllodcaambdaknbipemelie',
        icon: IcBrandEdge,
    },
    [Clients.Firefox]: {
        title: 'Firefox',
        link: 'https://addons.mozilla.org/en-US/firefox/addon/proton-pass',
        icon: IcBrandFirefox,
    },
    [Clients.Safari]: {
        title: 'Safari',
        link: 'https://apps.apple.com/app/id6502835663',
        icon: IcBrandSafari,
    },
    [Clients.CLI]: {
        title: 'Command line interface',
        link: 'https://protonpass.github.io/pass-cli/',
        icon: IcWindowTerminal,
    },
} as const;
