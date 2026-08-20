import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Button } from '@proton/atoms/Button/Button';
import type { PopperPlacement } from '@proton/atoms/Popper/interface';
import { Tooltip, TooltipTypeEnum } from '@proton/atoms/Tooltip/Tooltip';
import { IcGlobe } from '@proton/icons/icons/IcGlobe';

const placements: PopperPlacement[] = ['bottom', 'left', 'right', 'top'];

const meta: Meta<typeof Tooltip> = {
    title: 'Atoms/Tooltip',
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

export const NoFocusableElementAsChildren: Story = {
    parameters: {
        docs: {
            description: {
                story: "Whenever the children is a non-focusable element, the Tooltip won't be rendered. The solution is to wrap the content with a focusable element.",
            },
        },
    },
    render: (_) => (
        <div className="flex flex-row gap-20 items-center">
            <div className="flex flex-column items-center">
                <span>Icon without a wrapping div</span>
                <Tooltip title="Globe 1" openDelay={0}>
                    <IcGlobe />
                </Tooltip>
            </div>
            <div className="flex flex-column items-center">
                <span>Icon with a wrapping div</span>
                <Tooltip title="Globe 2" openDelay={0}>
                    <div className="flex items-center">
                        <IcGlobe />
                    </div>
                </Tooltip>
            </div>
        </div>
    ),
};
