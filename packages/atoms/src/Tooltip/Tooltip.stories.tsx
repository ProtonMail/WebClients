import type { Meta, StoryObj } from '@storybook/react';

import type { PopperPlacement } from '@proton/components/components/popper/interface';

import { Button } from '../Button/Button';
import { Tooltip, TooltipTypeEnum } from './Tooltip';

const placements: PopperPlacement[] = ['bottom', 'left', 'right', 'top'];

const meta: Meta<typeof Tooltip> = {
    argTypes: {
        closeDelay: {
            control: 'number',
        },
        isOpen: {
            control: 'boolean',
        },
        openDelay: {
            control: 'number',
        },
    },
    args: {
        children: <Button>Hover me</Button>,
        title: 'Hello!',
    },
    component: Tooltip,
    parameters: {
        docs: {
            description: {
                component: 'Tooltip component.',
            },
        },
    },
    tags: ['autodocs'],
    render: (args) => (
        <div className="flex flex-col m-10">
            <Tooltip {...args} />
        </div>
    ),
};

export default meta;

type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {};

export const IsOpen: Story = {
    args: {
        isOpen: true,
    },
};

export const AllTypes: Story = {
    ...IsOpen,
    render: (args) => (
        <div className="flex flex-col gap-8 m-10">
            {Object.values(TooltipTypeEnum)
                .sort()
                .map((type) => (
                    <Tooltip {...args} key={type} type={type} />
                ))}
        </div>
    ),
};

export const AllPlacements: Story = {
    ...IsOpen,
    render: (args) => (
        <div className="flex flex-col gap-20 m-10">
            {placements.map((placement) => (
                <Tooltip {...args} key={placement} originalPlacement={placement} />
            ))}
        </div>
    ),
};
