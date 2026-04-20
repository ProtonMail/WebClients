import React, { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Sidebar } from '@proton/components/components/sidebar/nav';

const withMemoryWrapper = (Story: React.ComponentType) => (
    <MemoryRouter>
        <Story />
    </MemoryRouter>
);

const meta: Meta = {
    title: 'Components/Sidebar/Branch',
    component: Sidebar.Branch,
    decorators: [withMemoryWrapper],
    parameters: {
        docs: {
            description: {
                component:
                    'Sidebar node used to group related sidebar items. Branch manages open/closed state (controlled or uncontrolled), provides hierarchical depth via context, and exposes compound subcomponents such as Branch.Header, Branch.Trigger, and Branch.Content.',
            },
        },
    },
    tags: ['autodocs'],
};
export default meta;

type Story = StoryObj;

export const DefaultClosed: Story = {
    name: 'defaultOpen = false',
    render: () => (
        <Sidebar.Root>
            <Sidebar.Branch>
                <Sidebar.Branch.Header>
                    <Sidebar.Branch.Text>Closed by default</Sidebar.Branch.Text>
                    <Sidebar.Branch.Trigger />
                </Sidebar.Branch.Header>
                <Sidebar.Branch.Content>
                    <Sidebar.Leaf to="/a">
                        <Sidebar.Leaf.Text>index.ts</Sidebar.Leaf.Text>
                    </Sidebar.Leaf>
                    <Sidebar.Leaf to="/b">
                        <Sidebar.Leaf.Text>utils.ts</Sidebar.Leaf.Text>
                    </Sidebar.Leaf>
                </Sidebar.Branch.Content>
            </Sidebar.Branch>
        </Sidebar.Root>
    ),
};

export const DefaultOpen: Story = {
    name: 'defaultOpen = true',
    render: () => (
        <Sidebar.Root>
            <Sidebar.Branch defaultOpen>
                <Sidebar.Branch.Header>
                    <Sidebar.Branch.Text>Open by default</Sidebar.Branch.Text>
                    <Sidebar.Branch.Trigger rotation={{ open: 180, closed: 0 }} />
                </Sidebar.Branch.Header>
                <Sidebar.Branch.Content>
                    <Sidebar.Leaf to="/a">
                        <Sidebar.Leaf.Text>index.ts</Sidebar.Leaf.Text>
                    </Sidebar.Leaf>
                    <Sidebar.Leaf to="/b">
                        <Sidebar.Leaf.Text>utils.ts</Sidebar.Leaf.Text>
                    </Sidebar.Leaf>
                </Sidebar.Branch.Content>
            </Sidebar.Branch>
        </Sidebar.Root>
    ),
};

export const IconPlacement: Story = {
    name: 'Icon placement',
    render: () => (
        <Sidebar.Root>
            <Sidebar.Branch>
                <Sidebar.Branch.Header>
                    <Sidebar.Branch.Trigger rotation={{ open: 180, closed: 0 }} />
                    <Sidebar.Branch.Text>Icon on the left</Sidebar.Branch.Text>
                </Sidebar.Branch.Header>
                <Sidebar.Branch.Content>
                    <Sidebar.Leaf to="/a">
                        <Sidebar.Leaf.Text>index.ts</Sidebar.Leaf.Text>
                    </Sidebar.Leaf>
                </Sidebar.Branch.Content>
            </Sidebar.Branch>
            <Sidebar.Branch>
                <Sidebar.Branch.Header>
                    <Sidebar.Branch.Text>Icon on the right</Sidebar.Branch.Text>
                    <Sidebar.Branch.Trigger rotation={{ open: 180, closed: 0 }} />
                </Sidebar.Branch.Header>
                <Sidebar.Branch.Content>
                    <Sidebar.Leaf to="/a">
                        <Sidebar.Leaf.Text>index.ts</Sidebar.Leaf.Text>
                    </Sidebar.Leaf>
                </Sidebar.Branch.Content>
            </Sidebar.Branch>
            <Sidebar.Branch>
                <Sidebar.Branch.Header>
                    <Sidebar.Branch.IconPlaceholder />
                    <Sidebar.Branch.Text>Icon on the right, placeholder on the left</Sidebar.Branch.Text>
                    <Sidebar.Branch.Trigger rotation={{ open: 180, closed: 0 }} />
                </Sidebar.Branch.Header>
                <Sidebar.Branch.Content>
                    <Sidebar.Leaf to="/a">
                        <Sidebar.Leaf.Text>index.ts</Sidebar.Leaf.Text>
                    </Sidebar.Leaf>
                </Sidebar.Branch.Content>
            </Sidebar.Branch>
            <Sidebar.Branch>
                <Sidebar.Branch.Header>
                    <Sidebar.Branch.Trigger rotation={{ open: 180, closed: 0 }} />
                    <Sidebar.Branch.Text>Icon on both</Sidebar.Branch.Text>
                    <Sidebar.Branch.Trigger rotation={{ open: 180, closed: 0 }} />
                </Sidebar.Branch.Header>
                <Sidebar.Branch.Content>
                    <Sidebar.Leaf to="/a">
                        <Sidebar.Leaf.Text>index.ts</Sidebar.Leaf.Text>
                    </Sidebar.Leaf>
                </Sidebar.Branch.Content>
            </Sidebar.Branch>
            <Sidebar.Branch>
                <Sidebar.Branch.Header>
                    <Sidebar.Branch.IconPlaceholder />
                    <Sidebar.Branch.Text>Placeholder on both</Sidebar.Branch.Text>
                    <Sidebar.Branch.IconPlaceholder />
                </Sidebar.Branch.Header>
                <Sidebar.Branch.Content>
                    <Sidebar.Leaf to="/a">
                        <Sidebar.Leaf.Text>index.ts</Sidebar.Leaf.Text>
                    </Sidebar.Leaf>
                </Sidebar.Branch.Content>
            </Sidebar.Branch>
        </Sidebar.Root>
    ),
};

export const Controlled: Story = {
    render: () => {
        const [open, setOpen] = useState(false);
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                    <input
                        type="checkbox"
                        checked={open}
                        onChange={(e) => setOpen(e.target.checked)}
                        style={{ marginRight: 6 }}
                    />
                    open = {String(open)}
                </label>
                <Sidebar.Root>
                    <Sidebar.Branch open={open} onOpenChange={setOpen}>
                        <Sidebar.Branch.Header>
                            <Sidebar.Branch.Text>Controlled branch</Sidebar.Branch.Text>
                            <Sidebar.Branch.Trigger rotation={{ open: 180, closed: 0 }} />
                        </Sidebar.Branch.Header>
                        <Sidebar.Branch.Content>
                            <Sidebar.Leaf to="/controlled">
                                <Sidebar.Leaf.Text>controlled.ts</Sidebar.Leaf.Text>
                            </Sidebar.Leaf>
                        </Sidebar.Branch.Content>
                    </Sidebar.Branch>
                </Sidebar.Root>
            </div>
        );
    },
};

export const NestedBranches: Story = {
    name: 'Nested (3 levels)',
    render: () => (
        <Sidebar.Root>
            <Sidebar.Branch defaultOpen>
                <Sidebar.Branch.Header>
                    <Sidebar.Branch.Text>Level 1</Sidebar.Branch.Text>
                    <Sidebar.Branch.Trigger rotation={{ open: 180, closed: 0 }} />
                </Sidebar.Branch.Header>
                <Sidebar.Branch.Content>
                    <Sidebar.Branch defaultOpen>
                        <Sidebar.Branch.Header>
                            <Sidebar.Branch.Text>Level 1.1</Sidebar.Branch.Text>
                            <Sidebar.Branch.Trigger rotation={{ open: 180, closed: 0 }} />
                        </Sidebar.Branch.Header>
                        <Sidebar.Branch.Content>
                            <Sidebar.Branch defaultOpen>
                                <Sidebar.Branch.Header>
                                    <Sidebar.Branch.Text>Level 1.1.1</Sidebar.Branch.Text>
                                    <Sidebar.Branch.Trigger rotation={{ open: 180, closed: 0 }} />
                                </Sidebar.Branch.Header>
                                <Sidebar.Branch.Content>
                                    <Sidebar.Leaf to="/deep">
                                        <Sidebar.Leaf.Text>Sidebar.Leaf 1.1.1.1</Sidebar.Leaf.Text>
                                    </Sidebar.Leaf>
                                </Sidebar.Branch.Content>
                            </Sidebar.Branch>
                        </Sidebar.Branch.Content>
                    </Sidebar.Branch>
                </Sidebar.Branch.Content>
            </Sidebar.Branch>
        </Sidebar.Root>
    ),
};
