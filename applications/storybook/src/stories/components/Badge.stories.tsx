import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Badge, CLASSNAMES } from '@proton/components/components/badge/Badge';
import type { BadgeType } from '@proton/components/components/badge/Badge';

const meta: Meta<typeof Badge> = {
    title: 'Components/Badge',
    args: {
        children: 'Badge',
        type: 'primary',
    },
    component: Badge,
    parameters: {
        docs: {
            description: {
                component: 'Generally used to display a badge with a type and a tooltip.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Badge>;

export const Default: Story = {};

export const AllTypes: Story = {
    render: () => (
        <div className="flex flex-col gap-8 m-10">
            {Object.keys(CLASSNAMES).map((type) => (
                <Badge key={type} type={type as BadgeType}>
                    {type}
                </Badge>
            ))}
        </div>
    ),
};

export const WithTooltip: Story = {
    args: {
        tooltip: 'Boo!',
        tooltipOpenDelay: 100,
    },
};

export const WithUrl: Story = {
    args: {
        url: 'https://www.proton.ch',
    },
};

export const WithClassName: Story = {
    args: {
        className: 'text-bold',
    },
};
