import { c } from 'ttag';

import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { Audience, VPNCountries, VPNServers } from '@proton/shared/lib/interfaces';
import { PLANS } from '@proton/shared/lib/constants';
import { getBasicServers, getFreeServers, getPlusServers } from '@proton/shared/lib/vpn/features';

import { useVPNCountriesCount, useVPNServersCount } from '../../../hooks';
import { Icon } from '../../../components';
import { Feature, PlanLabel, Tier } from './interface';
import Features from './Features';

const CheckIcon = () => <Icon className="color-primary" name="checkmark" alt={c('information').t`Included`} />;
const EmDash = '—';

const getFeatures = (vpnCountries: VPNCountries, serversCount: VPNServers, audience: Audience): Feature[] => {
    return [
        {
            name: 'servers',
            label: c('VPN feature').t`Servers around the world`,
            [Tier.free]: getFreeServers(serversCount.free_vpn, vpnCountries.free_vpn.count),
            [Tier.first]: getBasicServers(serversCount[PLANS.VPNBASIC], vpnCountries[PLANS.VPNBASIC].count),
            [Tier.second]: getPlusServers(serversCount[PLANS.VPNPLUS], vpnCountries[PLANS.VPNPLUS].count),
            [Tier.third]: getPlusServers(serversCount[PLANS.VPNPLUS], vpnCountries[PLANS.VPNPLUS].count),
        },
        audience === Audience.B2B && {
            name: 'no-logs',
            label: c('VPN feature').t`Connect anywhere`,
            tooltip: c('VPN feature tooltip')
                .t`Connect to the internet securely from all your devices (iOS, Android, macOS, Windows, Linux) wherever you are, whether at a local cafe or on a business trip abroad.`,
            [Tier.free]: <CheckIcon />,
            [Tier.first]: <CheckIcon />,
            [Tier.second]: <CheckIcon />,
            [Tier.third]: <CheckIcon />,
        },
        {
            name: 'no-logs',
            label: c('VPN feature').t`Strict no-logs policy`,
            [Tier.free]: <CheckIcon />,
            [Tier.first]: <CheckIcon />,
            [Tier.second]: <CheckIcon />,
            [Tier.third]: <CheckIcon />,
        },
        audience === Audience.B2C && {
            name: 'bandwidth',
            label: c('VPN feature').t`Unlimited volume/bandwidth`,
            [Tier.free]: <CheckIcon />,
            [Tier.first]: <CheckIcon />,
            [Tier.second]: <CheckIcon />,
            [Tier.third]: <CheckIcon />,
        },
        audience === Audience.B2C && {
            name: 'dns-leak',
            label: c('VPN feature').t`DNS leak prevention`,
            tooltip: c('VPN feature tooltip')
                .t`We use our own DNS servers and run your requests through our encrypted VPN tunnel to prevent any DNS leaks that could expose your online activity.`,
            [Tier.free]: <CheckIcon />,
            [Tier.first]: <CheckIcon />,
            [Tier.second]: <CheckIcon />,
            [Tier.third]: <CheckIcon />,
        },
        audience === Audience.B2C && {
            name: 'kill-switch',
            label: c('VPN feature').t`Kill switch/always-on VPN`,
            tooltip: c('VPN feature tooltip')
                .t`Keeps you protected by blocking all network connections when you are accidentally disconnected from our VPN server.`,
            [Tier.free]: <CheckIcon />,
            [Tier.first]: <CheckIcon />,
            [Tier.second]: <CheckIcon />,
            [Tier.third]: <CheckIcon />,
        },
        audience === Audience.B2C && {
            name: 'encryption',
            label: c('VPN feature').t`Full-disk encryption on servers`,
            [Tier.free]: <CheckIcon />,
            [Tier.first]: <CheckIcon />,
            [Tier.second]: <CheckIcon />,
            [Tier.third]: <CheckIcon />,
        },
        audience === Audience.B2C && {
            name: 'router',
            label: c('VPN feature').t`Router support`,
            [Tier.free]: <CheckIcon />,
            [Tier.first]: <CheckIcon />,
            [Tier.second]: <CheckIcon />,
            [Tier.third]: <CheckIcon />,
        },
        {
            name: 'netshield',
            label:
                audience === Audience.B2B
                    ? c('VPN feature').t`Malware blocker`
                    : c('VPN feature').t`Built-in ad-blocker (NetShield)`,
            tooltip: c('VPN feature tooltip')
                .t`Specially designed NetShield protects your device and speeds up your browsing by blocking ads, trackers, and malware.`,
            [Tier.free]: EmDash,
            [Tier.first]: EmDash,
            [Tier.second]: <CheckIcon />,
            [Tier.third]: <CheckIcon />,
        },
        audience === Audience.B2C && {
            name: 'streaming',
            label: c('VPN feature').t`Access to streaming services globally`,
            tooltip: c('VPN feature tooltip')
                .t`Access top shows and other digital content, including geographically blocked content, with VPN and a streaming service like Netflix, Disney+, and Prime Video.`,
            [Tier.free]: EmDash,
            [Tier.first]: EmDash,
            [Tier.second]: <CheckIcon />,
            [Tier.third]: <CheckIcon />,
        },
        audience === Audience.B2C && {
            name: 'p2p',
            label: c('VPN feature').t`P2P/BitTorrent`,
            tooltip: c('VPN feature tooltip').t`Support for file sharing protocols like BitTorrent.`,
            [Tier.free]: EmDash,
            [Tier.first]: EmDash,
            [Tier.second]: <CheckIcon />,
            [Tier.third]: <CheckIcon />,
        },
        audience === Audience.B2C && {
            name: 'tor',
            label: c('VPN feature').t`Tor over VPN`,
            tooltip: c('VPN feature tooltip')
                .t`Route your internet traffic through the Tor network with a single click.`,
            [Tier.free]: EmDash,
            [Tier.first]: EmDash,
            [Tier.second]: <CheckIcon />,
            [Tier.third]: <CheckIcon />,
        },
        audience === Audience.B2C && {
            name: 'secure-core',
            label: c('VPN feature').t`Secure Core servers`,
            tooltip: c('VPN feature tooltip')
                .t`Defends against threats to VPN privacy by passing your internet traffic through multiple servers.`,
            [Tier.free]: EmDash,
            [Tier.first]: EmDash,
            [Tier.second]: <CheckIcon />,
            [Tier.third]: <CheckIcon />,
        },
        audience === Audience.B2C && {
            name: 'tunneling',
            label: c('VPN feature').t`Split tunneling`,
            tooltip: c('VPN feature tooltip')
                .t`Allows you to access more than one network at the same time, e.g. stream a film from another country while still getting local search results.`,
            [Tier.free]: c('VPN feature').t`Android and Windows only`,
            [Tier.first]: c('VPN feature').t`Android and Windows only`,
            [Tier.second]: c('VPN feature').t`Android and Windows only`,
            [Tier.third]: c('VPN feature').t`Android and Windows only`,
        },
    ].filter(isTruthy);
};

interface Props {
    onSelect: (planName: PLANS) => void;
    activeTab: number;
    onSetActiveTab: (activeTab: number) => void;
    planLabels: PlanLabel[];
    audience: Audience;
}

const VPNFeatures = ({ audience, planLabels, onSelect, activeTab, onSetActiveTab }: Props) => {
    const [vpnCountries] = useVPNCountriesCount();
    const [vpnServersCount] = useVPNServersCount();
    const features = getFeatures(vpnCountries, vpnServersCount, audience);

    return (
        <Features
            title={c('Title').t`VPN features`}
            onSelect={onSelect}
            planLabels={planLabels}
            features={features}
            activeTab={activeTab}
            onSetActiveTab={onSetActiveTab}
        />
    );
};

export default VPNFeatures;
