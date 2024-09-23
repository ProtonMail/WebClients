import { Icon } from '@proton/components';

import VerticalStep from './VerticalStep';
import VerticalSteps from './VerticalSteps';
import mdx from './VerticalSteps.mdx';

export default {
    component: VerticalSteps,
    subcomponents: { VerticalStep },
    title: 'components/VerticalSteps',
    parameters: { docs: { page: mdx } },
};

export const Basic = () => (
    <VerticalSteps>
        <VerticalStep
            icon={<Icon name="checkmark" className="m-auto" size={4} />}
            title="Choose a username"
            description="You successfully selected your new email address."
            status="passed"
        />
        <VerticalStep
            icon={<Icon name="lock" className="m-auto" size={4} />}
            title="Today: get instant access"
            description="15 GB secure mailbox with unlimited personalisation."
            status="done"
        />
        <VerticalStep
            icon={<Icon name="bell" className="m-auto" size={4} />}
            title="Day 24: Trial end reminder"
            description="We’ll send you a notice. Cancel anytime."
        />
        <VerticalStep
            icon={<Icon name="calendar-row" className="m-auto" size={4} />}
            title="Day 30: Trial ends"
            description="Your subscription will start Jan 16th. Cancel anytime before."
        />
    </VerticalSteps>
);

export const Primary = () => (
    <VerticalSteps className="vertical-steps--primary">
        <VerticalStep
            titleCentered
            titleBold={false}
            title="Select service to update"
            icon={<span className="m-auto">1</span>}
        />
        <VerticalStep
            titleCentered
            titleBold={false}
            title="Do another great step"
            icon={<span className="m-auto">2</span>}
        />
        <VerticalStep
            titleCentered
            titleBold={false}
            title="Do another great step again"
            icon={<span className="m-auto">3</span>}
        />
        <VerticalStep
            titleCentered
            titleBold={false}
            title="Do another great step final step"
            icon={<span className="m-auto">4</span>}
        />
    </VerticalSteps>
);
