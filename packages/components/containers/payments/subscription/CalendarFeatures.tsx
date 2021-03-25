import React from 'react';
import { c } from 'ttag';
import { APPS, PLANS } from 'proton-shared/lib/constants';

import { Icon } from '../../../components';
import { CalendarFeature } from './interface';
import Features from './Features';

const CheckIcon = () => <Icon className="color-primary" name="on" alt={c('Info').t`Included`} />;
const EmDash = '—';

const getFeatures = (): CalendarFeature[] => {
    return [
        {
            name: 'multi',
            label: c('Calendar feature').t`Multiple calendars`,
            free: c('Calendar feature option').t`1 calendar`,
            [PLANS.PLUS]: c('Calendar feature option').t`25 calendars`,
            [PLANS.PROFESSIONAL]: c('Calendar feature option').t`25 calendars / user`,
            [PLANS.VISIONARY]: c('Calendar feature option').t`25 calendars / user`,
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
            name: 'recurring',
            label: c('Calendar feature').t`Recurring events`,
            free: <CheckIcon />,
            [PLANS.PLUS]: <CheckIcon />,
            [PLANS.PROFESSIONAL]: <CheckIcon />,
            [PLANS.VISIONARY]: <CheckIcon />,
        },
        {
            name: 'invitation',
            label: c('Calendar feature').t`Recurring events`,
            free: <CheckIcon />,
            [PLANS.PLUS]: <CheckIcon />,
            [PLANS.PROFESSIONAL]: <CheckIcon />,
            [PLANS.VISIONARY]: <CheckIcon />,
        },
        {
            name: 'share',
            label: c('Calendar feature').t`Recurring events`,
            free: EmDash,
            [PLANS.PLUS]: <CheckIcon />,
            [PLANS.PROFESSIONAL]: <CheckIcon />,
            [PLANS.VISIONARY]: <CheckIcon />,
        },
    ];
};

interface Props {
    onSelect: (planName: PLANS | 'free') => void;
}

const CalendarFeatures = ({ onSelect }: Props) => {
    const features = getFeatures();
    const planLabels = [
        { label: 'Free', key: 'free' } as const,
        { label: 'Plus', key: PLANS.PLUS },
        { label: 'Professional', key: PLANS.PROFESSIONAL },
        { label: 'Visionary', key: PLANS.VISIONARY },
    ];
    return <Features appName={APPS.PROTONCALENDAR} onSelect={onSelect} planLabels={planLabels} features={features} />;
};

export default CalendarFeatures;
