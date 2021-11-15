import { c } from 'ttag';
import { PLANS } from '@proton/shared/lib/constants';

import { Icon } from '../../../components';
import { Feature, PlanLabel, Tier } from './interface';
import Features from './Features';

const CheckIcon = () => <Icon className="color-primary" name="checkmark" alt={c('Info').t`Included`} />;
// const EmDash = '—';

const getFeatures = (): Feature[] => {
    return [
        {
            name: 'webaccess',
            label: c('Drive feature').t`Upload & download files`,
            [Tier.free]: <CheckIcon />,
            [Tier.first]: <CheckIcon />,
            [Tier.second]: <CheckIcon />,
            [Tier.third]: <CheckIcon />,
        },
        {
            name: 'uploadDownloadFiles',
            label: c('Drive feature').t`Share files via link`,
            tooltip: c('Drive feature tooltip').t`Generate a public link to give anyone access to your selected files.`,
            [Tier.free]: <CheckIcon />,
            [Tier.first]: <CheckIcon />,
            [Tier.second]: <CheckIcon />,
            [Tier.third]: <CheckIcon />,
        },
        {
            name: 'shareFiles',
            label: c('Drive feature').t`Advanced sharing security`,
            tooltip: c('Drive feature tooltip')
                .t`Keep control over who has access to files shared by adding password protection and/or link expiration.`,
            [Tier.free]: <CheckIcon />,
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

const DriveFeatures = ({ planLabels, onSelect, activeTab, onSetActiveTab }: Props) => {
    const features = getFeatures();
    return (
        <Features
            title={c('Title').t`Drive features (beta)`}
            onSelect={onSelect}
            planLabels={planLabels}
            features={features}
            activeTab={activeTab}
            onSetActiveTab={onSetActiveTab}
        />
    );
};

export default DriveFeatures;
