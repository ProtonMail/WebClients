import { c } from 'ttag';

import type { SectionConfig } from '@proton/components';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, VPN_APP_NAME } from '@proton/shared/lib/constants';

export const getVpnAppRoutes = ({ app }: { app: APP_NAMES }) => {
    return <const>{
        available: app === APPS.PROTONVPN_SETTINGS,
        header: VPN_APP_NAME,
        routes: {
            downloads: {
                id: 'downloads',
                text: c('Title').t`VPN apps`,
                to: '/vpn-apps',
                icon: 'arrow-down-line',
                subsections: [
                    {
                        text: '',
                        id: 'upgrade',
                    },
                    {
                        text: VPN_APP_NAME,
                        id: 'protonvpn-clients',
                    },
                ],
            },
            wireguard: {
                id: 'wireguard',
                text: c('Title').t`WireGuard`,
                to: '/WireGuard',
                icon: 'brand-wireguard',
                subsections: [
                    {
                        text: c('Title').t`WireGuard configuration`,
                        id: 'wireguard-configuration',
                    },
                ],
            },
            openvpn: {
                id: 'openvpn',
                text: c('Title').t`OpenVPN / IKEv2`,
                to: '/OpenVpnIKEv2',
                icon: 'key',
                subsections: [
                    {
                        text: c('Title').t`Credentials`,
                        id: 'openvpn',
                    },
                    {
                        text: c('Title').t`OpenVPN configuration files`,
                        id: 'openvpn-configuration-files',
                    },
                ],
            },
        } satisfies Record<string, SectionConfig>,
    };
};
