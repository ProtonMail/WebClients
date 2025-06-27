import type { Meta, StoryObj } from '@storybook/react';

import { Panel } from './Panel';
import { PanelHeader } from './PanelHeader';

const HeaderTitle = <h3>Some header</h3>;

const meta: Meta<typeof Panel> = {
    args: {
        children: <p>Some content</p>,
        footer: <p>Some footer</p>,
        header: <PanelHeader title={HeaderTitle} />,
        loading: false,
    },
    component: Panel,
    parameters: {
        docs: {
            description: {
                component: 'Panel and PanelHeader components.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Panel>;

export const Default: Story = {};

export const Loading: Story = {
    args: {
        children: null,
        loading: true,
    },
};

export const WithPanelHeaderSubtitle: Story = {
    args: {
        header: <PanelHeader subtitle={<h5>Some header subtitle</h5>} title={HeaderTitle} />,
    },
};
