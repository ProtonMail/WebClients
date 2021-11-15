import { c } from 'ttag';
import { PLANS } from '@proton/shared/lib/constants';
import { Audience } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { Icon } from '../../../components';
import { Feature, PlanLabel, Tier } from './interface';
import Features from './Features';

const CheckIcon = () => <Icon className="color-primary" name="checkmark" alt={c('Info').t`Included`} />;
const EmDash = '—';

const getFeatures = (audience: Audience): Feature[] => {
    return [
        {
            name: 'schedule',
            label: c('Calendar feature').t`Schedule events`,
            [Tier.free]: <CheckIcon />,
            [Tier.first]: <CheckIcon />,
            [Tier.second]: <CheckIcon />,
            [Tier.third]: <CheckIcon />,
        },
        audience === Audience.B2C && {
            name: 'recurring',
            label: c('Calendar feature').t`Recurring events`,
            [Tier.free]: <CheckIcon />,
            [Tier.first]: <CheckIcon />,
            [Tier.second]: <CheckIcon />,
            [Tier.third]: <CheckIcon />,
        },
        {
            name: 'invitation',
            label: c('Calendar feature').t`Send & receive invitations`,
            [Tier.free]: <CheckIcon />,
            [Tier.first]: <CheckIcon />,
            [Tier.second]: <CheckIcon />,
            [Tier.third]: <CheckIcon />,
        },
        audience === Audience.B2B && {
            name: 'recurring',
            label: c('Calendar feature').t`Recurring events`,
            [Tier.free]: <CheckIcon />,
            [Tier.first]: <CheckIcon />,
            [Tier.second]: <CheckIcon />,
            [Tier.third]: <CheckIcon />,
        },
        {
            name: 'share',
            label: c('Calendar feature').t`Share calendar via link`,
            tooltip:
                audience === Audience.B2B
                    ? c('Calendar feature tooltip').t`Easily share your calendars with your colleagues via a link.`
                    : c('Calendar feature tooltip')
                          .t`Easily share your calendars with your partner, family, or friends via a link.`,
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

const CalendarFeatures = ({ audience, planLabels, onSelect, activeTab, onSetActiveTab }: Props) => {
    const features = getFeatures(audience);
    return (
        <Features
            title={c('Title').t`Calendar features`}
            onSelect={onSelect}
            planLabels={planLabels}
            features={features}
            activeTab={activeTab}
            onSetActiveTab={onSetActiveTab}
        />
    );
};

export default CalendarFeatures;
