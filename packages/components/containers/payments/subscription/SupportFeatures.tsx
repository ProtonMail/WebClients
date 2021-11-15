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
            name: 'hipaa',
            label: c('Support feature').t`Enables HIPAA compliance`,
            tooltip: c('Tooltip')
                .t`We’re committed to helping customers subject to HIPAA/HITECH regulations safeguard protected health information (PHI). Signed BAAs available for all Proton for Business users.`,
            [Tier.free]: <CheckIcon />,
            [Tier.first]: <CheckIcon />,
            [Tier.second]: <CheckIcon />,
            [Tier.third]: <CheckIcon />,
        },
        {
            name: 'priority',
            label: c('Support feature').t`Priority email support`,
            tooltip: c('Tooltip')
                .t`On business days, receive support from the Proton Customer Support team within 24 hours of requests.`,
            [Tier.free]: EmDash,
            [Tier.first]: <CheckIcon />,
            [Tier.second]: <CheckIcon />,
            [Tier.third]: <CheckIcon />,
        },
        {
            name: 'phone',
            label: c('Support feature').t`Phone support`,
            tooltip: c('Tooltip')
                .t`Phone support is available from the Proton Customer Success team during European business hours.`,
            [Tier.free]: c('').t`No`,
            [Tier.first]: c('').t`Available to accounts with 6 or more users`,
            [Tier.second]: c('').t`Available to accounts with 6 or more users`,
        },
        {
            name: 'sla',
            label: c('Support feature').t`SLA`,
            tooltip: c('Tooltip')
                .t`Our robust infrastructure ensures you will be able to access your account when you need it.`,
            [Tier.free]: EmDash,
            [Tier.first]: '99.95%',
            [Tier.second]: '99.95%',
            [Tier.third]: '99.95%',
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
