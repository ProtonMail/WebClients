import type { Meta, StoryObj } from '@storybook/react';

import { DualPaneContent, DualPaneSidebar } from '@proton/atoms';

const meta: Meta<typeof FC> = {
    args: {
        dualPaneContentChildren: 'Content',
        dualPaneSidebarChildren: 'Sidebar',
    },
    component: DualPaneContent,
    parameters: {
        docs: {
            description: {
                component: `DualPaneContent and DualPaneSidebar components.`,
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof FC>;

export const Default: Story = {
    render: (args) => (
        <div className="flex items-center justify-start flex-nowrap w-full h-full bg-weak">
            <DualPaneSidebar>{args.dualPaneSidebarChildren}</DualPaneSidebar>
            <DualPaneContent>{args.dualPaneContentChildren}</DualPaneContent>
        </div>
    ),
};
