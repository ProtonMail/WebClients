import VerticalSteps from './VerticalSteps';
import VerticalStep from './VerticalStep';

import mdx from './VerticalSteps.mdx';

export default {
    component: VerticalSteps,
    title: 'components/VerticalSteps',
    parameters: { docs: { page: mdx } },
};

export const Basic = () => (
    <VerticalSteps>
        <VerticalStep
            icon="checkmark"
            title="Choose a username"
            description="You successfully selected your new email address."
            status="passed"
        />
        <VerticalStep
            icon="lock"
            title="Today: get instant access"
            description="15 GB secure mailbox with unlimited personalisation."
            status="done"
        />
        <VerticalStep
            icon="bell"
            title="Day 24: Trial end reminder"
            description="We’ll send you a notice. Cancel anytime."
        />
        <VerticalStep
            icon="calendar-row"
            title="Day 30: Trial ends"
            description="Your subscription will start Jan 16th. Cancel anytime before."
        />
    </VerticalSteps>
);

export const StoryWithoutCanvas = () => <div>I am a story without a canvas</div>;

export const StoryWithCanvas = () => <div>I am a story with a canvas</div>;
