import type { Meta, StoryObj } from '@storybook/react';

import { Step, Stepper, StepperPositionEnum } from '@proton/atoms';

const ITEMS = ['Item 1', 'Item 2.', 'Item 3', 'Item 4'];
const Steps = ITEMS.map((step) => <Step key={step}>{step}</Step>);

const meta: Meta<typeof Stepper> = {
    args: {
        activeStep: 0,
        children: Steps,
        position: StepperPositionEnum.Center,
    },
    argTypes: {
        activeStep: {
            control: 'radio',
            options: ITEMS.map((_, index) => index),
        },
        position: {
            control: 'radio',
            options: Object.values(StepperPositionEnum),
        },
    },
    component: Stepper,
    subcomponents: { Step },
    parameters: {
        docs: {
            description: {
                component:
                    'The `Stepper` displays progress through sequential steps. It is controlled by passing the current step index as the `activeStep` prop.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Stepper>;

export const Default: Story = {};

export const AllPositions: Story = {
    render: (args) => (
        <div className="flex flex-col gap-8">
            {Object.values(StepperPositionEnum)
                .sort()
                .map((position) => (
                    <Stepper {...args} key={position} position={position} />
                ))}
        </div>
    ),
};

export const AllSteps: Story = {
    render: (args) => (
        <div className="flex flex-col gap-8">
            {ITEMS.map((_, index) => (
                <Stepper {...args} key={index} activeStep={index} />
            ))}
        </div>
    ),
};
