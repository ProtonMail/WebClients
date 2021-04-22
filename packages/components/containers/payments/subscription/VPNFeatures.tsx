import React from 'react';
import { c } from 'ttag';
import { APPS, PLANS } from 'proton-shared/lib/constants';
import { getAppName } from 'proton-shared/lib/apps/helper';
import { Plan, VPNCountries } from 'proton-shared/lib/interfaces';
import { FREE_VPN_PLAN } from 'proton-shared/lib/subscription/freePlans';

import { useVPNCountriesCount } from '../../../hooks';
import { Icon } from '../../../components';
import { VPNFeature } from './interface';
import Features from './Features';

const CheckIcon = () => <Icon className="color-primary" name="on" alt={c('information').t`Included`} />;
const EmDash = '—';

const getFeatures = (vpnCountries: VPNCountries, planNamesMap: { [key: string]: Plan }): VPNFeature[] => {
    const mailAppName = getAppName(APPS.PROTONMAIL);
    return [
        {
            name: 'connections',
            label: c('VPN feature').t`VPN Connections`,
            free: `${FREE_VPN_PLAN.MaxVPN}`,
            [PLANS.VPNBASIC]: `${planNamesMap[PLANS.VPNBASIC].MaxVPN}`,
            [PLANS.VPNPLUS]: `${planNamesMap[PLANS.VPNPLUS].MaxVPN}`,
            [PLANS.VISIONARY]: `${planNamesMap[PLANS.VISIONARY].MaxVPN}`,
        },
        {
            name: 'speed',
            label: c('VPN feature').t`Speed`,
            free: c('VPN feature option').t`Medium`,
            [PLANS.VPNBASIC]: c('VPN feature option').t`High`,
            [PLANS.VPNPLUS]: c('VPN feature option').t`Highest (up to 10 Gbps)`,
            [PLANS.VISIONARY]: c('VPN feature option').t`Highest (10 Gbps)`,
        },
        {
            name: 'servers',
            label: c('VPN feature').t`VPN servers`,
            free: 17,
            [PLANS.VPNBASIC]: '350+',
            [PLANS.VPNPLUS]: '1200+',
            [PLANS.VISIONARY]: '1200+',
        },
        {
            name: 'countries',
            label: c('VPN feature').t`Locations/Countries`,
            free: `${vpnCountries.free_vpn.count} (US, NL, JP)`,
            [PLANS.VPNBASIC]: vpnCountries[PLANS.VPNBASIC].count,
            [PLANS.VPNPLUS]: vpnCountries[PLANS.VPNPLUS].count,
            [PLANS.VISIONARY]: vpnCountries[PLANS.VPNPLUS].count,
        },
        {
            name: 'netshield',
            label: c('VPN feature').t`Adblocker (NetShield)`,
            tooltip: c('Tooltip')
                .t`NetShield protects your device and speeds up your browsing by blocking ads, trackers, and malware.`,
            free: EmDash,
            [PLANS.VPNBASIC]: <CheckIcon />,
            [PLANS.VPNPLUS]: <CheckIcon />,
            [PLANS.VISIONARY]: <CheckIcon />,
        },
        {
            name: 'filesharing',
            label: c('VPN feature').t`P2P/BitTorrent`,
            tooltip: c('Tooltip').t`Support for file sharing protocols such as BitTorrent.`,
            free: EmDash,
            [PLANS.VPNBASIC]: <CheckIcon />,
            [PLANS.VPNPLUS]: <CheckIcon />,
            [PLANS.VISIONARY]: <CheckIcon />,
        },
        {
            name: 'content',
            label: c('VPN feature').t`Specific content unlocking`,
            tooltip: c('Tooltip')
                .t`Access geo-blocked content (Netflix, Amazon Prime Video, BBC iPlayer, Wikipedia, Facebook, YouTube, etc) no matter where you are.`,
            free: EmDash,
            [PLANS.VPNBASIC]: EmDash,
            [PLANS.VPNPLUS]: <CheckIcon />,
            [PLANS.VISIONARY]: <CheckIcon />,
        },
        {
            name: 'tor',
            label: c('VPN feature').t`Tor over VPN`,
            tooltip: c('Tooltip').t`Route your Internet traffic through the Tor network with a single click.`,
            free: EmDash,
            [PLANS.VPNBASIC]: EmDash,
            [PLANS.VPNPLUS]: <CheckIcon />,
            [PLANS.VISIONARY]: <CheckIcon />,
        },
        {
            name: 'secure-core',
            label: c('VPN feature').t`Secure Core servers`,
            tooltip: c('Tooltip')
                .t`Defends against threats to VPN privacy by passing your Internet traffic through multiple servers.`,
            free: EmDash,
            [PLANS.VPNBASIC]: EmDash,
            [PLANS.VPNPLUS]: <CheckIcon />,
            [PLANS.VISIONARY]: <CheckIcon />,
        },
        {
            name: 'visionary',
            label: c('VPN feature').t`${mailAppName} Visionary`,
            tooltip: c('Tooltip')
                .t`Get access to all the paid features for both ProtonVPN and ProtonMail (the encrypted email service that millions use to protect their data) with one plan.`,
            free: EmDash,
            [PLANS.VPNBASIC]: EmDash,
            [PLANS.VPNPLUS]: EmDash,
            [PLANS.VISIONARY]: <CheckIcon />,
        },
        {
            name: 'juridiction',
            label: c('VPN feature').t`Jurisdiction`,
            free: c('VPN feature option').t`Switzerland`,
            [PLANS.VPNBASIC]: c('VPN feature option').t`Switzerland`,
            [PLANS.VPNPLUS]: c('VPN feature option').t`Switzerland`,
            [PLANS.VISIONARY]: c('VPN feature option').t`Switzerland`,
        },
        {
            name: 'audited',
            label: c('VPN feature').t`Open Source & audited apps`,
            free: <CheckIcon />,
            [PLANS.VPNBASIC]: <CheckIcon />,
            [PLANS.VPNPLUS]: <CheckIcon />,
            [PLANS.VISIONARY]: <CheckIcon />,
        },
        {
            name: 'access blocked content',
            label: c('VPN feature').t`Access blocked content`,
            free: EmDash,
            [PLANS.VPNBASIC]: EmDash,
            [PLANS.VPNPLUS]: <CheckIcon />,
            [PLANS.VISIONARY]: <CheckIcon />,
        },
        {
            name: 'no-logs',
            label: c('VPN feature').t`Strict no-logs policy`,
            free: <CheckIcon />,
            [PLANS.VPNBASIC]: <CheckIcon />,
            [PLANS.VPNPLUS]: <CheckIcon />,
            [PLANS.VISIONARY]: <CheckIcon />,
        },
        {
            name: 'bandwidth',
            label: c('VPN feature').t`Volume/bandwidth cap`,
            free: EmDash,
            [PLANS.VPNBASIC]: EmDash,
            [PLANS.VPNPLUS]: EmDash,
            [PLANS.VISIONARY]: EmDash,
        },
        {
            name: 'data',
            label: c('VPN feature').t`User data monetization`,
            free: c('VPN feature option').t`None`,
            [PLANS.VPNBASIC]: c('VPN feature option').t`None`,
            [PLANS.VPNPLUS]: c('VPN feature option').t`None`,
            [PLANS.VISIONARY]: c('VPN feature option').t`None`,
        },
        {
            name: 'platform',
            label: c('VPN feature').t`Platforms supported`,
            free: c('VPN feature option').t`Windows, macOS, iOS, Linux, Android, Android TV, Chromebook, Chromecast`,
            [PLANS.VPNBASIC]: c('VPN feature option')
                .t`Windows, macOS, iOS, Linux, Android, Android TV, Chromebook, Chromecast`,
            [PLANS.VPNPLUS]: c('VPN feature option')
                .t`Windows, macOS, iOS, Linux, Android, Android TV, Chromebook, Chromecast`,
            [PLANS.VISIONARY]: c('VPN feature option')
                .t`Windows, macOS, iOS, Linux, Android, Android TV, Chromebook, Chromecast`,
        },
        {
            name: 'language',
            label: c('VPN feature').t`Languages supported`,
            free: 12,
            [PLANS.VPNBASIC]: 12,
            [PLANS.VPNPLUS]: 12,
            [PLANS.VISIONARY]: 12,
        },
        {
            name: 'DNS',
            label: c('VPN feature').t`DNS leak prevention`,
            free: <CheckIcon />,
            [PLANS.VPNBASIC]: <CheckIcon />,
            [PLANS.VPNPLUS]: <CheckIcon />,
            [PLANS.VISIONARY]: <CheckIcon />,
        },
        {
            name: 'kill switch',
            label: c('VPN feature').t`Kill Switch / Always-on VPN`,
            free: <CheckIcon />,
            [PLANS.VPNBASIC]: <CheckIcon />,
            [PLANS.VPNPLUS]: <CheckIcon />,
            [PLANS.VISIONARY]: <CheckIcon />,
        },
        {
            name: 'PFS',
            label: c('VPN feature').t`Perfect Forward Secrecy (PFS)`,
            free: <CheckIcon />,
            [PLANS.VPNBASIC]: <CheckIcon />,
            [PLANS.VPNPLUS]: <CheckIcon />,
            [PLANS.VISIONARY]: <CheckIcon />,
        },
        {
            name: 'encryption',
            label: c('VPN feature').t`Full Disk Encryption on Servers`,
            free: <CheckIcon />,
            [PLANS.VPNBASIC]: <CheckIcon />,
            [PLANS.VPNPLUS]: <CheckIcon />,
            [PLANS.VISIONARY]: <CheckIcon />,
        },
        {
            name: 'split tunneling',
            label: c('VPN feature').t`Split tunneling`,
            free: (
                <span className="inline-flex flex-nowrap">
                    <span className="flex-item-noshrink mr0-5">
                        <CheckIcon />
                    </span>
                    <span>{c('VPN feature option').t`(Android & Windows only)`}</span>
                </span>
            ),
            [PLANS.VPNBASIC]: (
                <span className="inline-flex flex-nowrap">
                    <span className="flex-item-noshrink mr0-5">
                        <CheckIcon />
                    </span>
                    <span>{c('VPN feature option').t`(Android & Windows only)`}</span>
                </span>
            ),
            [PLANS.VPNPLUS]: (
                <span className="inline-flex flex-nowrap">
                    <span className="flex-item-noshrink mr0-5">
                        <CheckIcon />
                    </span>
                    <span>{c('VPN feature option').t`(Android & Windows only)`}</span>
                </span>
            ),
            [PLANS.VISIONARY]: (
                <span className="inline-flex flex-nowrap">
                    <span className="flex-item-noshrink mr0-5">
                        <CheckIcon />
                    </span>
                    <span>{c('VPN feature option').t`(Android & Windows only)`}</span>
                </span>
            ),
        },
        {
            name: 'profiles',
            label: c('VPN feature').t`Custom connection profiles`,
            free: <CheckIcon />,
            [PLANS.VPNBASIC]: <CheckIcon />,
            [PLANS.VPNPLUS]: <CheckIcon />,
            [PLANS.VISIONARY]: <CheckIcon />,
        },
        {
            name: 'router',
            label: c('VPN feature').t`Router support`,
            free: <CheckIcon />,
            [PLANS.VPNBASIC]: <CheckIcon />,
            [PLANS.VPNPLUS]: <CheckIcon />,
            [PLANS.VISIONARY]: <CheckIcon />,
        },
        {
            name: 'money-back',
            label: c('VPN feature').t`30-days money-back guarantee`,
            free: 'N/A',
            [PLANS.VPNBASIC]: <CheckIcon />,
            [PLANS.VPNPLUS]: <CheckIcon />,
            [PLANS.VISIONARY]: <CheckIcon />,
        },
    ];
};

interface Props {
    onSelect: (planName: PLANS | 'free') => void;
    planNamesMap: { [key: string]: Plan };
}

const VPNFeatures = ({ onSelect, planNamesMap }: Props) => {
    const [vpnCountries] = useVPNCountriesCount();

    const features = getFeatures(vpnCountries, planNamesMap);
    const planLabels = [
        { label: 'Free', key: 'free' } as const,
        { label: 'Basic', key: PLANS.VPNBASIC },
        { label: 'Plus', key: PLANS.VPNPLUS },
        { label: 'Visionary', key: PLANS.VISIONARY },
    ];

    return (
        <Features appName={APPS.PROTONVPN_SETTINGS} onSelect={onSelect} planLabels={planLabels} features={features} />
    );
};

export default VPNFeatures;
