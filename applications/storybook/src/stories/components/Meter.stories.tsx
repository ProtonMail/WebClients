import type { Meta, StoryObj } from '@storybook/react-webpack5';

import Meter from '@proton/components/components/progress/Meter';

const meta: Meta<typeof Meter> = {
    title: 'Components/Meter',
    args: {
        min: 0,
        low: 50,
        high: 80,
        max: 100,
        optimum: 0,
        value: 50,
    },
    component: Meter,
    parameters: {
        docs: {
            description: {
                component:
                    'A meter component that visually represents a scalar value within a known range. Supports thin variant, squared style, and labeled display.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Meter>;

export const Default: Story = {};

export const DifferentValues: Story = {
    render: () => (
        <>
            <Meter className="my-4" value={20} />
            <Meter className="my-4" value={75} />
            <Meter className="my-4" value={100} />
        </>
    ),
};

export const Thin: Story = {
    args: {
        thin: true,
        value: 40,
    },
};

export const Squared: Story = {
    args: {
        squared: true,
        value: 60,
    },
};

export const WithLabel: Story = {
    args: {
        label: '50% used',
        value: 50,
    },
};
