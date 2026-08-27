import { c } from 'ttag';

import type { SectionConfig } from '@proton/components';
import { IcArrowDownLine } from '@proton/icons/icons/IcArrowDownLine';
import { IcBrandWireguard } from '@proton/icons/icons/IcBrandWireguard';
import { IcKey } from '@proton/icons/icons/IcKey';
import { APPS, VPN_APP_NAME } from '@proton/shared/lib/constants';

import type { GeneralRouterParams } from '../../content/router-params';

export const getVpnAppRoutes = ({ app }: GeneralRouterParams) => {
    return <const>{
        available: app === APPS.PROTONVPN_SETTINGS || app === APPS.PROTONACCOUNT,
        header: VPN_APP_NAME,
        routes: {
            downloads: {
                id: 'downloads',
                text: c('Title').t`VPN apps`,
                to: '/vpn-apps',
                icon: IcArrowDownLine,
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
                icon: IcBrandWireguard,
                subsections: [
                    {
                        text: c('Title').t`WireGuard configuration`,
                        id: 'wireguard-configuration',
                    },
                ],
            },
            openvpn: {
                id: 'openvpn',
                text: c('Title').t`OpenVPN`,
                to: '/OpenVpn',
                icon: IcKey,
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
