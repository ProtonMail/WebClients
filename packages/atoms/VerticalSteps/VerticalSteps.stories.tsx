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
            icon={<Icon name="checkmark" className="mauto" size={16} />}
            title="Choose a username"
            description="You successfully selected your new email address."
            status="passed"
        />
        <VerticalStep
            icon={<Icon name="lock" className="mauto" size={16} />}
            title="Today: get instant access"
            description="15 GB secure mailbox with unlimited personalisation."
            status="done"
        />
        <VerticalStep
            icon={<Icon name="bell" className="mauto" size={16} />}
            title="Day 24: Trial end reminder"
            description="We’ll send you a notice. Cancel anytime."
        />
        <VerticalStep
            icon={<Icon name="calendar-row" className="mauto" size={16} />}
            title="Day 30: Trial ends"
            description="Your subscription will start Jan 16th. Cancel anytime before."
        />
    </VerticalSteps>
);
