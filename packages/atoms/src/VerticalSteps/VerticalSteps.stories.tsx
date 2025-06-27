import type { Meta, StoryObj } from '@storybook/react';

import { Icon } from '@proton/components';

import { VerticalStep, VerticalStepStatusEnum } from './VerticalStep';
import { VerticalSteps } from './VerticalSteps';

const meta: Meta<typeof VerticalSteps> = {
    component: VerticalSteps,
    parameters: {
        docs: {
            description: {
                component:
                    'Creates a vertical timeline UI. Each item accepts a few props: `title`, `description`, `status` (done, passed, next), `icon`.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof VerticalSteps>;

export const Default: Story = {
    render: () => (
        <VerticalSteps>
            <VerticalStep
                icon={<Icon name="checkmark" className="m-auto" size={4} />}
                title="Step 1"
                description="Description for Step 1"
                status={VerticalStepStatusEnum.Passed}
            />
            <VerticalStep
                icon={<Icon name="lock" className="m-auto" size={4} />}
                title="Step 2"
                description="Description for Step 2"
                status={VerticalStepStatusEnum.Done}
            />
            <VerticalStep
                icon={<Icon name="bell" className="m-auto" size={4} />}
                title="Step 3"
                description="Description for Step 3"
                status={VerticalStepStatusEnum.Next}
            />
        </VerticalSteps>
    ),
};

export const AllStatuses: Story = {
    render: () => (
        <VerticalSteps>
            {Object.values(VerticalStepStatusEnum)
                .sort()
                .map((status) => (
                    <VerticalStep
                        key={status}
                        icon={<Icon name="checkmark" className="m-auto" size={4} />}
                        title={`Status: ${status}`}
                        description="Description"
                        status={status}
                    />
                ))}
        </VerticalSteps>
    ),
};

export const WithTitleNotBold: Story = {
    render: () => (
        <VerticalSteps>
            <VerticalStep
                icon={<Icon name="checkmark" className="m-auto" size={4} />}
                title="Step"
                description="Description"
                status={VerticalStepStatusEnum.Next}
                titleBold={false}
            />
        </VerticalSteps>
    ),
};
