import type { Meta, StoryObj } from '@storybook/react';

// import type { CircleLoaderProps } from '@proton/atoms';
import { DashboardCard, DashboardGrid, DashboardGridSection, DashboardGridSectionHeader } from '@proton/atoms';

const meta: Meta<typeof DashboardGrid> = {
    args: {
        columns: 3,
    },
    component: DashboardGrid,
    parameters: {
        docs: {
            description: {
                component: 'DashboardGrid component.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof DashboardGrid>;

export const Default: Story = {
    render: (props) => (
        <DashboardGrid {...props} className="bg-weak p-8">
            <DashboardGridSection position="header-center" spanAll="header">
                <DashboardGridSectionHeader title="Header" />
            </DashboardGridSection>
            <DashboardGridSection position="content-left">
                <DashboardCard>Left</DashboardCard>
            </DashboardGridSection>
            <DashboardGridSection position="content-center">
                <DashboardCard>Center</DashboardCard>
            </DashboardGridSection>
            <DashboardGridSection position="content-right">
                <DashboardCard>Right</DashboardCard>
            </DashboardGridSection>
        </DashboardGrid>
    ),
};
