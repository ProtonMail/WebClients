import { c } from 'ttag';
import { PLANS, APPS } from '@proton/shared/lib/constants';
import { Audience } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { getAppName } from '@proton/shared/lib/apps/helper';

import { Icon } from '../../../components';
import { Feature, PlanLabel, Tier } from './interface';
import Features from './Features';

const CheckIcon = () => <Icon className="color-primary" name="check" alt={c('Info').t`Included`} />;
const EmDash = '—';

const mailAppName = getAppName(APPS.PROTONMAIL);
const driveAppName = getAppName(APPS.PROTONDRIVE);

const getFeatures = (audience: Audience): Feature[] => {
    return [
        {
            name: 'users',
            label: c('Highlight feature').t`Number of users`,
            tooltip:
                audience === Audience.B2B
                    ? c('Tooltip').t`Each user gets an individual account for email, calendar, and VPN.`
                    : undefined,
            [Tier.free]: '1',
            [Tier.first]: audience === Audience.B2B ? c('Highlight feature').t`Custom` : '1',
            [Tier.second]: audience === Audience.B2B ? c('Highlight feature').t`Custom` : '1',
            [Tier.third]: '5',
        },
        {
            name: 'storage',
            label:
                audience === Audience.B2B
                    ? c('Highlight feature').t`Storage per user`
                    : c('Highlight feature').t`Total storage`,
            tooltip:
                audience === Audience.B2B
                    ? c('Tooltip')
                          .t`Administrators can decide how much storage to allocate to each user. To determine total storage available to allocate, multiply number of users by the per-user storage amount included in your plan.`
                    : c('Tooltip')
                          .t`Storage space is shared across Mail, Drive, and Calendar. Those managing family accounts can allocate to individual family members different storage amounts.`,
            [Tier.free]:
                audience === Audience.B2B
                    ? c('Highlight feature').t`Up to 2 GB`
                    : c('Highlight feature').t`Up to 2 GB*`,
            [Tier.first]: c('Highlight feature').t`15 GB`,
            [Tier.second]: c('Highlight feature').t`500 GB`,
            [Tier.third]: c('Highlight feature').t`2.5 TB`,
        },
        {
            name: 'addresses',
            label:
                audience === Audience.B2B
                    ? c('Highlight feature').t`Email addresses/aliases per user`
                    : c('Highlight feature').t`Email addresses/aliases`,
            tooltip:
                audience === Audience.B2B
                    ? c('Tooltip')
                          .t`A user can have multiple email aliases associated with their mailbox. However, a single mailbox cannot be shared by multiple users.`
                    : c('Tooltip')
                          .t`Create multiple email addresses to protect and match your online identities, e.g., JohnShopper@proton.me for your shopping accounts, JohnNews@proton.me for all your news subscriptions.`,
            [Tier.free]: '1',
            [Tier.first]: '10',
            [Tier.second]: '15',
            [Tier.third]: '75',
        },
        {
            name: 'calendars',
            label:
                audience === Audience.B2B
                    ? c('Highlight feature').t`Calendars per user`
                    : c('Highlight feature').t`Calendars`,
            tooltip: c('Tooltip')
                .t`Calendars have full events-management capabilities and integrate into ${mailAppName} for easy scheduling with all your contacts.`,
            [Tier.free]: '1',
            [Tier.first]: '20',
            [Tier.second]: '20',
            [Tier.third]: '100',
        },
        {
            name: 'domains',
            label: c('Highlight feature').t`Custom email domains`,
            tooltip:
                audience === Audience.B2B
                    ? c('Tooltip')
                          .t`Customize your email addresses with your own domain purchased from a domain name registrar e.g., JohnSmith@mycompanydomain.com.`
                    : c('Tooltip')
                          .t`Customize your email addresses with your own domain purchased from a domain name registrar e.g., JohnSmith@myownaddress.com.`,
            [Tier.free]: audience === Audience.B2B ? '1' : '0',
            [Tier.first]: audience === Audience.B2B ? '3' : '1',
            [Tier.second]: audience === Audience.B2B ? '10' : '3',
            [Tier.third]: '5',
        },
        {
            name: 'vpn',
            label:
                audience === Audience.B2B
                    ? c('Highlight feature').t`VPN connections per user`
                    : c('Highlight feature').t`VPN connections`,
            tooltip:
                audience === Audience.B2B
                    ? c('Tooltip')
                          .t`Safeguard your internal data with VPN by ensuring everyone in your organization's internet connections are secure, even when they are connecting remotely.`
                    : c('Tooltip')
                          .t`Protect your family's identity, location, and data whenever any of you go online, especially on public WiFi networks. Multiple VPN connections ensure every device has a secure connection.`,
            [Tier.free]: '1',
            [Tier.first]: '1',
            [Tier.second]: '10',
            [Tier.third]: '50',
        },
        {
            name: 'vpn-speed',
            label: c('Highlight feature').t`VPN speed`,
            [Tier.free]: c('Highlight feature').t`Medium`,
            [Tier.first]: c('Highlight feature').t`Medium`,
            [Tier.second]: c('Highlight feature').t`Highest (up to 10 Gbps)`,
            [Tier.third]: c('Highlight feature').t`Highest (up to 10 Gbps)`,
        },
        audience === Audience.B2C && {
            name: 'support',
            label: c('Highlight feature').t`Support`,
            [Tier.free]: c('Highlight feature').t`Limited`,
            [Tier.first]: c('Highlight feature').t`Priority`,
            [Tier.second]: c('Highlight feature').t`Priority`,
            [Tier.third]: c('Highlight feature').t`Priority`,
        },
        audience === Audience.B2C && {
            name: 'easy-switch',
            label: c('Highlight feature').t`Easy Switch import assistant`,
            tooltip: c('Tooltip')
                .t`Easily move your existing emails, calendars, files, and contacts from Google or other providers.`,
            [Tier.free]: <CheckIcon />,
            [Tier.first]: <CheckIcon />,
            [Tier.second]: <CheckIcon />,
            [Tier.third]: <CheckIcon />,
        },
        audience === Audience.B2C && {
            name: 'login',
            label: c('Highlight feature').t`Multiple logins`,
            tooltip: c('Tooltip').t`Each user gets an individual account for email, calendar, and VPN.`,
            [Tier.free]: EmDash,
            [Tier.first]: EmDash,
            [Tier.second]: EmDash,
            [Tier.third]: <CheckIcon />,
        },

        audience === Audience.B2B && {
            name: 'drive',
            label: c('Highlight feature').t`Drive access (beta)`,
            tooltip: c('Tooltip')
                .t`${driveAppName} (beta) is an encrypted cloud storage solution for easy, secure storage and transfer of files.`,
            [Tier.free]: EmDash,
            [Tier.first]: EmDash,
            [Tier.second]: EmDash,
            [Tier.third]: <CheckIcon />,
        },
        audience === Audience.B2B && {
            name: 'admin',
            label: c('Highlight feature').t`Migration tools`,
            tooltip: c('Tooltip')
                .t`Import emails, calendars, and contacts from any existing email and calendar provider via Easy Switch, IMAP, or file import.`,
            [Tier.free]: <CheckIcon />,
            [Tier.first]: <CheckIcon />,
            [Tier.second]: <CheckIcon />,
            [Tier.third]: <CheckIcon />,
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

const HighlightFeatures = ({ audience, planLabels, onSelect, activeTab, onSetActiveTab }: Props) => {
    const features = getFeatures(audience);
    return (
        <Features
            title={c('Title').t`Highlights`}
            onSelect={onSelect}
            planLabels={planLabels}
            features={features}
            activeTab={activeTab}
            onSetActiveTab={onSetActiveTab}
        />
    );
};

export default HighlightFeatures;
