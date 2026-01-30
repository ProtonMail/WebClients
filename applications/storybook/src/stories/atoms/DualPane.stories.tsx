import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { DualPaneContent } from '@proton/atoms/DualPane/DualPaneContent';
import { DualPaneSidebar } from '@proton/atoms/DualPane/DualPaneSidebar';

const meta: Meta<typeof DualPaneContent | typeof DualPaneSidebar> = {
    title: 'Atoms/DualPane',
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

type Story = StoryObj<typeof DualPaneContent | typeof DualPaneSidebar>;

export const Default: Story = {
    render: () => (
        <div className="flex items-center justify-start flex-nowrap w-full h-full bg-weak">
            <DualPaneSidebar>Sidebar</DualPaneSidebar>
            <DualPaneContent>Content</DualPaneContent>
        </div>
    ),
};
