import { useState } from 'react';
import { MemoryRouter } from 'react-router-dom';

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { Sidebar } from '@proton/components/components/sidebar/nav';
import { Icon } from '@proton/components/index';

const withMemoryWrapper = (Story: React.ComponentType) => (
    <MemoryRouter>
        <Story />
    </MemoryRouter>
);

const meta: Meta = {
    title: 'Components/Sidebar/Sidebar',
    component: Sidebar.Root,
    decorators: [withMemoryWrapper],
    parameters: {
        docs: {
            description: {
                component:
                    'Sidebar root container that establishes layout context and resets branch depth. It provides the structural wrapper for all Branch and Leaf nodes within the sidebar tree.',
            },
        },
    },
    tags: ['autodocs'],
};
export default meta;

type Story = StoryObj;

type L1Key = 'workspace' | 'projects' | 'team' | null;

export const FullNestedSidebar: Story = {
    name: 'FullNestedSidebar',
    render: () => {
        const [openL1, setOpenL1] = useState<L1Key>('workspace');
        const toggleL1 = (key: L1Key) => setOpenL1((prev) => (prev === key ? null : key));

        return (
            <div style={{ width: 280 }}>
                <Sidebar.Root>
                    {/* Workspace */}
                    <Sidebar.Branch open={openL1 === 'workspace'} onOpenChange={() => toggleL1('workspace')}>
                        <Sidebar.Branch.Header className="text-lg">
                            <Sidebar.Branch.Trigger rotation={{ open: 0, closed: -90 }} />
                            <Sidebar.Branch.Text>Workspace</Sidebar.Branch.Text>
                        </Sidebar.Branch.Header>
                        <Sidebar.Branch.Content>
                            <Sidebar.Branch defaultOpen>
                                <Sidebar.Branch.Header>
                                    <Icon name="file-lines" />
                                    <Sidebar.Branch.Text>Design</Sidebar.Branch.Text>
                                    <Sidebar.Branch.Trigger rotation={{ open: 180 }} name="chevron-down" />
                                </Sidebar.Branch.Header>
                                <Sidebar.Branch.Content>
                                    <Sidebar.Leaf to="/other-link">
                                        <Sidebar.Leaf.IconPlaceholder />
                                        <Sidebar.Leaf.Text>system.fig</Sidebar.Leaf.Text>
                                    </Sidebar.Leaf>
                                    <Sidebar.Leaf to="/some-link">
                                        <Sidebar.Leaf.IconPlaceholder />
                                        <Sidebar.Leaf.Text>components.fig</Sidebar.Leaf.Text>
                                    </Sidebar.Leaf>
                                    <Sidebar.Leaf to="/some-link">
                                        <Icon name="file-lines" />
                                        <Sidebar.Leaf.Text>icons.fig</Sidebar.Leaf.Text>
                                    </Sidebar.Leaf>
                                </Sidebar.Branch.Content>
                            </Sidebar.Branch>
                            <Sidebar.Branch>
                                <Sidebar.Branch.Header>
                                    <Icon name="file-lines" />
                                    <Sidebar.Branch.Text>Docs</Sidebar.Branch.Text>
                                    <Sidebar.Branch.Trigger rotation={{ open: 180 }} name="chevron-down" />
                                </Sidebar.Branch.Header>
                                <Sidebar.Branch.Content>
                                    <Sidebar.Leaf to="/some-link">
                                        <Icon name="file-lines" />
                                        <Sidebar.Leaf.Text>overview.md</Sidebar.Leaf.Text>
                                    </Sidebar.Leaf>
                                    <Sidebar.Leaf to="/some-link">
                                        <Icon name="file-lines" />
                                        <Sidebar.Leaf.Text>api.md</Sidebar.Leaf.Text>
                                    </Sidebar.Leaf>
                                    <Sidebar.Leaf to="/some-link">
                                        <Icon name="file-lines" />
                                        <Sidebar.Leaf.Text>changelog.md</Sidebar.Leaf.Text>
                                    </Sidebar.Leaf>
                                </Sidebar.Branch.Content>
                            </Sidebar.Branch>
                            <Sidebar.Leaf to="/some-link">
                                <Icon name="file-lines" />
                                <Sidebar.Leaf.Text>README.md</Sidebar.Leaf.Text>
                            </Sidebar.Leaf>
                            <Sidebar.Leaf to="some-workspace">
                                <Icon name="meet-settings" />
                                <Sidebar.Leaf.Text>workspace.json</Sidebar.Leaf.Text>
                            </Sidebar.Leaf>
                        </Sidebar.Branch.Content>
                    </Sidebar.Branch>

                    {/* Projects */}
                    <Sidebar.Branch open={openL1 === 'projects'} onOpenChange={() => toggleL1('projects')}>
                        <Sidebar.Branch.Header className="text-lg">
                            <Sidebar.Branch.Trigger rotation={{ open: 0, closed: -90 }} />
                            <Sidebar.Branch.Text>Projects</Sidebar.Branch.Text>
                        </Sidebar.Branch.Header>
                        <Sidebar.Branch.Content>
                            <Sidebar.Branch>
                                <Sidebar.Branch.Header>
                                    <Icon name="file-lines" />
                                    <Sidebar.Branch.Text>Frontend</Sidebar.Branch.Text>
                                    <Sidebar.Branch.Trigger />
                                </Sidebar.Branch.Header>
                                <Sidebar.Branch.Content>
                                    <Sidebar.Leaf to="/some-link">
                                        <Icon name="file-lines" />
                                        <Sidebar.Leaf.Text>App.tsx</Sidebar.Leaf.Text>
                                    </Sidebar.Leaf>
                                    <Sidebar.Leaf to="/some-link">
                                        <Icon name="file-lines" />
                                        <Sidebar.Leaf.Text>router.ts</Sidebar.Leaf.Text>
                                    </Sidebar.Leaf>
                                    <Sidebar.Leaf to="/some-link">
                                        <Icon name="file-lines" />
                                        <Sidebar.Leaf.Text>theme.ts</Sidebar.Leaf.Text>
                                    </Sidebar.Leaf>
                                </Sidebar.Branch.Content>
                            </Sidebar.Branch>
                            <Sidebar.Branch>
                                <Sidebar.Branch.Header>
                                    <Icon name="file-lines" />
                                    <Sidebar.Branch.Text>Backend</Sidebar.Branch.Text>
                                    <Sidebar.Branch.Trigger />
                                </Sidebar.Branch.Header>
                                <Sidebar.Branch.Content>
                                    <Sidebar.Leaf to="/some-link">
                                        <Icon name="file-lines" />
                                        <Sidebar.Leaf.Text>server.ts</Sidebar.Leaf.Text>
                                    </Sidebar.Leaf>
                                    <Sidebar.Leaf to="/some-link">
                                        <Icon name="file-lines" />
                                        <Sidebar.Leaf.Text>db.ts</Sidebar.Leaf.Text>
                                    </Sidebar.Leaf>
                                    <Sidebar.Leaf to="/some-link">
                                        <Icon name="file-lines" />
                                        <Sidebar.Leaf.Text>auth.ts</Sidebar.Leaf.Text>
                                    </Sidebar.Leaf>
                                </Sidebar.Branch.Content>
                            </Sidebar.Branch>
                            <Sidebar.Leaf to="/some-link">
                                <Icon name="file-lines" />
                                <Sidebar.Leaf.Text>package.json</Sidebar.Leaf.Text>
                            </Sidebar.Leaf>
                            <Sidebar.Leaf to="/some-link">
                                <Icon name="file-lines" />
                                <Sidebar.Leaf.Text>.env</Sidebar.Leaf.Text>
                            </Sidebar.Leaf>
                        </Sidebar.Branch.Content>
                    </Sidebar.Branch>

                    {/* Team */}
                    <Sidebar.Branch open={openL1 === 'team'} onOpenChange={() => toggleL1('team')}>
                        <Sidebar.Branch.Header className="text-lg">
                            <Sidebar.Branch.Trigger rotation={{ open: 0, closed: -90 }} />
                            <Sidebar.Branch.Text>Team</Sidebar.Branch.Text>
                        </Sidebar.Branch.Header>
                        <Sidebar.Branch.Content>
                            <Sidebar.Branch>
                                <Sidebar.Branch.Header>
                                    <Icon name="file-lines" />
                                    <Sidebar.Branch.Text>Engineering</Sidebar.Branch.Text>
                                    <Sidebar.Branch.Trigger />
                                </Sidebar.Branch.Header>
                                <Sidebar.Branch.Content>
                                    <Sidebar.Leaf to="/some-link">
                                        <Icon name="users" />
                                        <Sidebar.Leaf.Text>Alice</Sidebar.Leaf.Text>
                                    </Sidebar.Leaf>
                                    <Sidebar.Leaf to="/some-link">
                                        <Icon name="users" />
                                        <Sidebar.Leaf.Text>Bob</Sidebar.Leaf.Text>
                                    </Sidebar.Leaf>
                                    <Sidebar.Leaf to="/some-link">
                                        <Icon name="users" />
                                        <Sidebar.Leaf.Text>Carol</Sidebar.Leaf.Text>
                                    </Sidebar.Leaf>
                                </Sidebar.Branch.Content>
                            </Sidebar.Branch>
                            <Sidebar.Branch>
                                <Sidebar.Branch.Header>
                                    <Icon name="file-lines" />
                                    <Sidebar.Branch.Text>Design</Sidebar.Branch.Text>
                                    <Sidebar.Branch.Trigger />
                                </Sidebar.Branch.Header>
                                <Sidebar.Branch.Content>
                                    <Sidebar.Leaf to="/some-link">
                                        <Icon name="users" />
                                        <Sidebar.Leaf.Text>Diana</Sidebar.Leaf.Text>
                                    </Sidebar.Leaf>
                                    <Sidebar.Leaf to="/some-link">
                                        <Icon name="users" />
                                        <Sidebar.Leaf.Text>Evan</Sidebar.Leaf.Text>
                                    </Sidebar.Leaf>
                                    <Sidebar.Leaf to="/some-link">
                                        <Icon name="users" />
                                        <Sidebar.Leaf.Text>Fiona</Sidebar.Leaf.Text>
                                    </Sidebar.Leaf>
                                </Sidebar.Branch.Content>
                            </Sidebar.Branch>
                            <Sidebar.Leaf to="/some-link">
                                <Icon name="meet-settings" />
                                <Sidebar.Leaf.Text>Permissions</Sidebar.Leaf.Text>
                            </Sidebar.Leaf>
                            <Sidebar.Leaf to="/some-link">
                                <Icon name="meet-settings" />
                                <Sidebar.Leaf.Text>Notifications</Sidebar.Leaf.Text>
                            </Sidebar.Leaf>
                        </Sidebar.Branch.Content>
                    </Sidebar.Branch>
                </Sidebar.Root>
            </div>
        );
    },
};
