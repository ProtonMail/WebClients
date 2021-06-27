import { c } from 'ttag';
import { APPS, PLANS } from '@proton/shared/lib/constants';

import { Icon } from '../../../components';
import { DriveFeature } from './interface';
import Features from './Features';

const CheckIcon = () => <Icon className="color-primary" name="check" alt={c('Info').t`Included`} />;
const EmDash = '—';

const getFeatures = (): DriveFeature[] => {
    return [
        {
            name: 'webaccess',
            label: c('Drive feature').t`Access via Web`,
            free: EmDash,
            [PLANS.PLUS]: <CheckIcon />,
            [PLANS.PROFESSIONAL]: <CheckIcon />,
            [PLANS.VISIONARY]: <CheckIcon />,
        },
        {
            name: 'uploadDownloadFiles',
            label: c('Drive feature').t`Upload / download files`,
            free: EmDash,
            [PLANS.PLUS]: <CheckIcon />,
            [PLANS.PROFESSIONAL]: <CheckIcon />,
            [PLANS.VISIONARY]: <CheckIcon />,
        },
        {
            name: 'shareFiles',
            label: c('Drive feature').t`Share files via link`,
            free: EmDash,
            [PLANS.PLUS]: <CheckIcon />,
            [PLANS.PROFESSIONAL]: <CheckIcon />,
            [PLANS.VISIONARY]: <CheckIcon />,
        },
    ];
};

interface Props {
    onSelect: (planName: PLANS | 'free') => void;
    activeTab: number;
    onSetActiveTab: (activeTab: number) => void;
}

const DriveFeatures = ({ onSelect, activeTab, onSetActiveTab }: Props) => {
    const features = getFeatures();
    const planLabels = [
        { label: 'Free', key: 'free' } as const,
        { label: 'Plus', key: PLANS.PLUS },
        { label: 'Professional', key: PLANS.PROFESSIONAL },
        { label: 'Visionary', key: PLANS.VISIONARY },
    ];
    return (
        <Features
            appName={APPS.PROTONDRIVE}
            onSelect={onSelect}
            planLabels={planLabels}
            features={features}
            activeTab={activeTab}
            onSetActiveTab={onSetActiveTab}
        />
    );
};

export default DriveFeatures;
