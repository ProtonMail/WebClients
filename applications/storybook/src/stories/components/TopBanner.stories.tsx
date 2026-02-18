import type { Meta, StoryObj } from '@storybook/react-webpack5';

import TopBanner from '@proton/components/containers/topBanners/TopBanner';

const meta: Meta<typeof TopBanner> = {
    title: 'Components/Top Banner',
    args: {
        children: 'Example of a top banner',
        className: 'bg-danger',
    },
    component: TopBanner,
    parameters: {
        docs: {
            description: {
                component:
                    'A banner displayed at the top of the page. Supports custom background colors via className and an optional close button.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof TopBanner>;

export const Default: Story = {};

export const WithCloseButton: Story = {
    args: {
        children: 'Example of a top banner with close button',
        className: 'bg-danger',
        onClose: () => alert('Close button pressed'),
    },
};

export const AllColors: Story = {
    render: () => (
        <div className="flex flex-column gap-2">
            <TopBanner className="bg-norm">Banner with norm background</TopBanner>
            <TopBanner className="bg-weak">Banner with weak background</TopBanner>
            <TopBanner className="bg-strong">Banner with strong background</TopBanner>
            <TopBanner className="bg-primary">Banner with primary background</TopBanner>
            <TopBanner className="bg-danger">Banner with danger background</TopBanner>
            <TopBanner className="bg-warning">Banner with warning background</TopBanner>
            <TopBanner className="bg-success">Banner with success background</TopBanner>
            <TopBanner className="bg-info">Banner with info background</TopBanner>
            <TopBanner>Banner with no background</TopBanner>
        </div>
    ),
};
