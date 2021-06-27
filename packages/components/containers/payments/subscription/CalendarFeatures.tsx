import { c } from 'ttag';
import { APPS, PLANS } from '@proton/shared/lib/constants';

import { Icon } from '../../../components';
import { CalendarFeature } from './interface';
import Features from './Features';

const CheckIcon = () => <Icon className="color-primary" name="check" alt={c('Info').t`Included`} />;
const EmDash = '—';

const getFeatures = (): CalendarFeature[] => {
    return [
        {
            name: 'multi',
            label: c('Calendar feature').t`Multiple calendars`,
            free: '1',
            [PLANS.PLUS]: '20',
            [PLANS.PROFESSIONAL]: c('Calendar feature option').t`20 / user *`,
            [PLANS.VISIONARY]: c('Calendar feature option').t`20 / user`,
        },
        {
            name: 'import',
            label: c('Calendar feature').t`Calendar import`,
            free: <CheckIcon />,
            [PLANS.PLUS]: <CheckIcon />,
            [PLANS.PROFESSIONAL]: <CheckIcon />,
            [PLANS.VISIONARY]: <CheckIcon />,
        },
        {
            name: 'recurringEvents',
            label: c('Calendar feature').t`Recurring events`,
            free: <CheckIcon />,
            [PLANS.PLUS]: <CheckIcon />,
            [PLANS.PROFESSIONAL]: <CheckIcon />,
            [PLANS.VISIONARY]: <CheckIcon />,
        },
        {
            name: 'invitation',
            label: c('Calendar feature').t`Invitations`,
            free: <CheckIcon />,
            [PLANS.PLUS]: <CheckIcon />,
            [PLANS.PROFESSIONAL]: <CheckIcon />,
            [PLANS.VISIONARY]: <CheckIcon />,
        },
        {
            name: 'share',
            label: c('Calendar feature').t`Share Calendar via link`,
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

const CalendarFeatures = ({ onSelect, activeTab, onSetActiveTab }: Props) => {
    const features = getFeatures();
    const planLabels = [
        { label: 'Free', key: 'free' } as const,
        { label: 'Plus', key: PLANS.PLUS },
        { label: 'Professional', key: PLANS.PROFESSIONAL },
        { label: 'Visionary', key: PLANS.VISIONARY },
    ];
    return (
        <Features
            appName={APPS.PROTONCALENDAR}
            onSelect={onSelect}
            planLabels={planLabels}
            features={features}
            activeTab={activeTab}
            onSetActiveTab={onSetActiveTab}
        />
    );
};

export default CalendarFeatures;
