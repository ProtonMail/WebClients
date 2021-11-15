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
            name: 'contact-details',
            label: c('Contact feature').t`Encrypted contact details`,
            tooltip: c('Tooltip')
                .t`Securely store your contacts' addresses, phone numbers, and other personal information. Now fully integrated with Proton services.`,
            [Tier.free]: <CheckIcon />,
            [Tier.first]: <CheckIcon />,
            [Tier.second]: <CheckIcon />,
            [Tier.third]: <CheckIcon />,
        },
        {
            name: 'contact-group',
            label: c('Contact feature').t`Contact groups`,
            tooltip: c('Tooltip')
                .t`Send emails to large groups quickly and easily by creating as many contact groups as you need (up to 100 contacts per group).`,
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

const ContactFeatures = ({ planLabels, onSelect, activeTab, onSetActiveTab }: Props) => {
    const features = getFeatures();
    return (
        <Features
            title={c('Title').t`Contacts features`}
            onSelect={onSelect}
            planLabels={planLabels}
            features={features}
            activeTab={activeTab}
            onSetActiveTab={onSetActiveTab}
        />
    );
};

export default ContactFeatures;
