import { c } from 'ttag';

import { SectionConfig } from '@proton/components';
import { VPN_APP_NAME } from '@proton/shared/lib/constants';

export const getVpnAppRoutes = () => {
    return <const>{
        header: VPN_APP_NAME,
        routes: {
            downloads: <SectionConfig>{
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
            openvpn: <SectionConfig>{
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
            wireguard: <SectionConfig>{
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
        },
    };
};
