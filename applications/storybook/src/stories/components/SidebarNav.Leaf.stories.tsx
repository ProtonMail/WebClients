import { MemoryRouter } from 'react-router-dom';

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { NotificationDot } from '@proton/atoms/NotificationDot/NotificationDot';
import { ThemeColor } from '@proton/colors/types';
import { Sidebar } from '@proton/components/components/sidebar/nav';

const meta: Meta = {
    title: 'Components/Sidebar/Leaf',
    component: Sidebar.Leaf,
    parameters: {
        docs: {
            description: {
                component:
                    'Navigation item within the sidebar tree. Leaf renders a NavLink, supports active state styling, and inherits nesting depth from Branch context for consistent indentation and alignment.',
            },
        },
    },
    tags: ['autodocs'],
};
export default meta;

type LeafStory = StoryObj;
export const LeafDefault: LeafStory = {
    name: 'Default (inactive)',
    render: () => (
        <Sidebar.Root>
            <Sidebar.Leaf to="/readme">
                <Sidebar.Leaf.Text>README.md</Sidebar.Leaf.Text>
            </Sidebar.Leaf>
        </Sidebar.Root>
    ),
};

export const LeafActive: LeafStory = {
    name: 'Active (matching route)',
    decorators: [
        (Story) => (
            <MemoryRouter initialEntries={['/readme']}>
                <Story />
            </MemoryRouter>
        ),
    ],
    render: () => (
        <Sidebar.Root>
            <Sidebar.Leaf to="/readme">
                <Sidebar.Leaf.Text>README.md</Sidebar.Leaf.Text>
            </Sidebar.Leaf>
        </Sidebar.Root>
    ),
};

export const LeafWithPlaceholder: LeafStory = {
    name: 'With IconPlaceholder',
    render: () => (
        <Sidebar.Root>
            <Sidebar.Leaf to="/components">
                <Sidebar.Leaf.IconPlaceholder />
                <Sidebar.Leaf.Text>components.fig</Sidebar.Leaf.Text>
            </Sidebar.Leaf>
        </Sidebar.Root>
    ),
};

export const LeafOverflow: LeafStory = {
    name: 'Long label truncation',
    decorators: [
        (Story) => (
            <MemoryRouter>
                <div style={{ width: 180, padding: '8px 12px' }}>
                    <Story />
                </div>
            </MemoryRouter>
        ),
    ],
    render: () => (
        <Sidebar.Root>
            <Sidebar.Leaf to="/long">
                <Sidebar.Leaf.Text>a-very-long-filename-that-overflows.json</Sidebar.Leaf.Text>
            </Sidebar.Leaf>
        </Sidebar.Root>
    ),
};

export const LeafWithNotification: LeafStory = {
    name: 'With Notification',
    render: () => (
        <Sidebar.Root>
            <Sidebar.Leaf to="/components">
                <Sidebar.Leaf.IconPlaceholder />
                <Sidebar.Leaf.Text>You have something!</Sidebar.Leaf.Text>
                <NotificationDot color={ThemeColor.Norm} />
            </Sidebar.Leaf>
        </Sidebar.Root>
    ),
};
