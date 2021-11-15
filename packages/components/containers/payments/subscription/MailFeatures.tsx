import { c } from 'ttag';
import { PLANS, APPS } from '@proton/shared/lib/constants';
import { Audience } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { getAppName } from '@proton/shared/lib/apps/helper';
import { Icon } from '../../../components';
import { Feature, PlanLabel, Tier } from './interface';
import Features from './Features';

const CheckIcon = () => <Icon className="color-primary" name="checkmark" alt={c('Info').t`Included`} />;
const EmDash = '—';
const mailAppName = getAppName(APPS.PROTONMAIL);

const getFeatures = (audience: Audience): Feature[] => {
    return [
        audience === Audience.B2B && {
            name: 'e2e',
            label: c('Mail feature').t`End-to-end encryption`,
            tooltip: c('Tooltip')
                .t`PGP and SSL/TLS cryptographic technology ensure all messages sent to and from Proton addresses are encrypted. In addition, messages sent via SSL/TLS are stored on Proton's servers with zero-access encryption.`,
            [Tier.free]: <CheckIcon />,
            [Tier.first]: <CheckIcon />,
            [Tier.second]: <CheckIcon />,
            [Tier.third]: <CheckIcon />,
        },
        audience === Audience.B2B && {
            name: 'encryption-to-non-pm',
            label: c('Mail feature').t`Encryption to non-${mailAppName} users`,
            tooltip: c('Tooltip')
                .t`Encryption is automatic between ${mailAppName} addresses. To encrypt a message to a non-Proton address, just set a password prior to sending.`,
            [Tier.free]: <CheckIcon />,
            [Tier.first]: <CheckIcon />,
            [Tier.second]: <CheckIcon />,
            [Tier.third]: <CheckIcon />,
        },
        {
            name: 'messages',
            label: c('Mail feature').t`Messages per day`,
            [Tier.free]: '150',
            [Tier.first]: c('Mail feature option').t`Unlimited`,
            [Tier.second]: c('Mail feature option').t`Unlimited`,
            [Tier.third]: c('Mail feature option').t`Unlimited`,
        },
        {
            name: 'labels',
            label: c('Mail feature').t`Folders/labels`,
            tooltip: c('Tooltip').t`Keep your inbox organized with folders, subfolders, and labels.`,
            [Tier.free]: '3/3',
            [Tier.first]: c('Mail feature option').t`Unlimited`,
            [Tier.second]: c('Mail feature option').t`Unlimited`,
            [Tier.third]: c('Mail feature option').t`Unlimited`,
        },
        {
            name: 'filters',
            label: c('Mail feature').t`Custom filters`,
            tooltip: c('Tooltip').t`Set up filters to automatically filter emails that fit specified rules.`,
            [Tier.free]: '1',
            [Tier.first]: c('Mail feature option').t`Unlimited`,
            [Tier.second]: c('Mail feature option').t`Unlimited`,
            [Tier.third]: c('Mail feature option').t`Unlimited`,
        },
        audience === Audience.B2B && {
            name: 'autoresponder',
            label: c('Mail feature').t`Auto-reply`,
            tooltip: c('Tooltip').t`Allows you to set up automatic responses (auto-reply) for your incoming messages.`,
            [Tier.free]: c('Mail feature option').t`Limited`,
            [Tier.first]: c('Mail feature option').t`Priority`,
            [Tier.second]: c('Mail feature option').t`Priority`,
            [Tier.third]: c('Mail feature option').t`Priority`,
        },
        {
            name: 'attachment',
            label: c('Mail feature').t`Attachment size`,
            tooltip: c('Tooltip').t`Attachments are encrypted by default.`,
            [Tier.free]: c('Mail feature option').t`25 MB`,
            [Tier.first]: c('Mail feature option').t`25 MB`,
            [Tier.second]: c('Mail feature option').t`25 MB`,
            [Tier.third]: c('Mail feature option').t`25 MB`,
        },
        audience === Audience.B2B && {
            name: 'bulk',
            label: c('Mail feature').t`Bulk sending`,
            tooltip: c('Tooltip')
                .t`Bulk promotional or programmatic email sending is currently not supported. We recommend using a dedicated email service provider for this use case.`,
            [Tier.free]: c('Mail feature option').t`Not supported`,
            [Tier.first]: c('Mail feature option').t`Not supported`,
            [Tier.second]: c('Mail feature option').t`Not supported`,
            [Tier.third]: c('Mail feature option').t`Not supported`,
        },
        {
            name: 'signature',
            label: c('Mail feature').t`HTML signatures`,
            tooltip: c('Tooltip')
                .t`Customize your signatures with clickable images, logos, contact details, social media buttons, and more.`,
            [Tier.free]: <CheckIcon />,
            [Tier.first]: <CheckIcon />,
            [Tier.second]: <CheckIcon />,
            [Tier.third]: <CheckIcon />,
        },
        {
            name: 'imap',
            label: c('Mail feature').t`IMAP/SMTP & 3rd-party apps integration`,
            tooltip: c('Tooltip')
                .t`IMAP support is limited to desktop apps (e.g., Outlook, Apple Mail, Thunderbird) via ${mailAppName} Bridge. Cloud-based IMAP integrations are currently not supported.`,
            [Tier.free]: EmDash,
            [Tier.first]: <CheckIcon />,
            [Tier.second]: <CheckIcon />,
            [Tier.third]: <CheckIcon />,
        },
        audience === Audience.B2C && {
            name: 'autoresponder',
            label: c('Mail feature').t`Auto-reply`,
            tooltip: c('Tooltip').t`Allows you to set up automatic responses (auto-reply) for your incoming messages.`,
            [Tier.free]: EmDash,
            [Tier.first]: <CheckIcon />,
            [Tier.second]: <CheckIcon />,
            [Tier.third]: <CheckIcon />,
        },
        {
            name: 'catch-all',
            label: c('Mail feature').t`Catch-all email`,
            tooltip:
                audience === Audience.B2B
                    ? c('Tooltip')
                          .t`A mailbox set up to receive redirected emails sent to your custom email domain. This ensures your organization receives, e.g., emails with typos in the address or those addressed to former employees.`
                    : c('Tooltip')
                          .t`A mailbox set up to receive redirected emails sent to your custom domain. This ensures your organization receives, e.g., emails with typos in the address.`,
            [Tier.free]: EmDash,
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

const MailFeatures = ({ audience, planLabels, onSelect, activeTab, onSetActiveTab }: Props) => {
    const features = getFeatures(audience);
    return (
        <Features
            title={c('Title').t`Mail features`}
            onSelect={onSelect}
            planLabels={planLabels}
            features={features}
            activeTab={activeTab}
            onSetActiveTab={onSetActiveTab}
        />
    );
};

export default MailFeatures;
