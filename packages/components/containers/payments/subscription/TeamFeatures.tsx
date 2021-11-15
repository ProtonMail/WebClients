import { c } from 'ttag';
import { PLANS } from '@proton/shared/lib/constants';

import { Icon } from '../../../components';
import { Feature, PlanLabel, Tier } from './interface';
import Features from './Features';

const CheckIcon = () => <Icon className="color-primary" name="check" alt={c('Info').t`Included`} />;
const EmDash = '—';

const getFeatures = (): Feature[] => {
    return [
        {
            name: 'two-factor',
            label: c('Team feature').t`Two-factor authentication`,
            tooltip: c('Tooltip')
                .t`Two-factor authentication adds an extra layer of security to your account in case your password is compromised.`,
            [Tier.free]: <CheckIcon />,
            [Tier.first]: <CheckIcon />,
            [Tier.second]: <CheckIcon />,
            [Tier.third]: <CheckIcon />,
        },
        {
            name: 'console',
            label: c('Contact feature').t`Admin console`,
            tooltip: c('Tooltip').t`Add, manage, and remove users via the admin console.`,
            [Tier.free]: EmDash,
            [Tier.first]: <CheckIcon />,
            [Tier.second]: <CheckIcon />,
            [Tier.third]: <CheckIcon />,
        },
        {
            name: 'billing',
            label: c('Contact feature').t`Centralized billing`,
            tooltip: c('Tooltip')
                .t`Manage your subscription, including plan customizations. Payment methods accepted are credit card, cryptocurrency, and wire transfer.`,
            [Tier.free]: EmDash,
            [Tier.first]: <CheckIcon />,
            [Tier.second]: <CheckIcon />,
            [Tier.third]: <CheckIcon />,
        },
        {
            name: 'admin',
            label: c('Contact feature').t`Multiple admin roles`,
            tooltip: c('Tooltip')
                .t`Give selected users admin rights. Primary admins have billing control; non-primary admins can create and manage user accounts.`,
            [Tier.free]: EmDash,
            [Tier.first]: <CheckIcon />,
            [Tier.second]: <CheckIcon />,
            [Tier.third]: <CheckIcon />,
        },
        {
            name: 'sign',
            label: c('Contact feature').t`Sign in as user`,
            tooltip: c('Tooltip').t`View non-private user inboxes, including message content and contact details.`,
            [Tier.free]: EmDash,
            [Tier.first]: <CheckIcon />,
            [Tier.second]: <CheckIcon />,
            [Tier.third]: <CheckIcon />,
        },
        {
            name: 'creds',
            label: c('Contact feature').t`User credential management`,
            tooltip: c('Tooltip').t`Reset passwords and two-factor authentication on user accounts.`,
            [Tier.free]: EmDash,
            [Tier.first]: <CheckIcon />,
            [Tier.second]: <CheckIcon />,
            [Tier.third]: <CheckIcon />,
        },
        {
            name: 'session',
            label: c('Contact feature').t`User session management`,
            tooltip: c('Tooltip')
                .t`Force signout of user sessions when user credentials are believed to be compromised.`,
            [Tier.free]: EmDash,
            [Tier.first]: <CheckIcon />,
            [Tier.second]: <CheckIcon />,
            [Tier.third]: <CheckIcon />,
        },
    ];
};

interface Props {
    onSelect: (planName: PLANS) => void;
    activeTab: number;
    onSetActiveTab: (activeTab: number) => void;
    planLabels: PlanLabel[];
}

const TeamFeatures = ({ planLabels, onSelect, activeTab, onSetActiveTab }: Props) => {
    const features = getFeatures();
    return (
        <Features
            title={c('Title').t`Team management features`}
            onSelect={onSelect}
            planLabels={planLabels}
            features={features}
            activeTab={activeTab}
            onSetActiveTab={onSetActiveTab}
        />
    );
};

export default TeamFeatures;
