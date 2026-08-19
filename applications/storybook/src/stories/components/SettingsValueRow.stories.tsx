import type { ReactNode } from 'react';

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { DashboardCard, DashboardCardContent, DashboardCardDivider } from '@proton/atoms/DashboardCard/DashboardCard';
import Info from '@proton/components/components/link/Info';
import { SettingsIconRow } from '@proton/components/containers/account/SettingsIconRow';
import { SettingsValueRow } from '@proton/components/containers/account/SettingsValueRow';
import { IcCardIdentity } from '@proton/icons/icons/IcCardIdentity';
import { IcEnvelope } from '@proton/icons/icons/IcEnvelope';
import { IcPassword } from '@proton/icons/icons/IcPassword';
import { IcUserCircle } from '@proton/icons/icons/IcUserCircle';

/**
 * Settings rows are always rendered inside a DashboardCard, which is what gives them their
 * surface, padding and dividers. Stories wrap the card in a weak background to mimic the
 * settings page it sits on.
 */
const Card = ({ children }: { children: ReactNode }) => (
    <div className="bg-weak p-4 md:p-8">
        <DashboardCard>
            <DashboardCardContent>{children}</DashboardCardContent>
        </DashboardCard>
    </div>
);

const meta: Meta<typeof SettingsValueRow> = {
    title: 'Components/Settings/Value Row',
    component: SettingsValueRow,
    parameters: {
        docs: {
            description: {
                component:
                    'A read-only settings row displaying a label and its current value, optionally with an action such as an edit button. Compose it with `SettingsValueRow.Label`, `SettingsValueRow.Description` and `SettingsValueRow.EditButton`, place it inside a `SettingsIconRow` for the leading icon column, and stack rows in a `DashboardCard` / `DashboardCardContent` separated by `DashboardCardDivider`. On mobile the value wraps below the label; from `md` up it takes the right half of the row.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof SettingsValueRow>;

export const Default: Story = {
    render: () => (
        <Card>
            <SettingsIconRow icon={IcCardIdentity}>
                <SettingsValueRow
                    label={<SettingsValueRow.Label>Display name</SettingsValueRow.Label>}
                    value="Alice Anderson"
                    action={
                        <SettingsValueRow.EditButton
                            title="Edit display name"
                            aria-label="Edit display name"
                            onClick={() => {}}
                        />
                    }
                />
            </SettingsIconRow>
        </Card>
    ),
};

export const WithDescription: Story = {
    name: 'With description and Info tooltip',
    render: () => (
        <Card>
            <SettingsIconRow icon={IcUserCircle}>
                <SettingsValueRow
                    label={
                        <>
                            <SettingsValueRow.Label>
                                Username
                                <Info title="You can edit this once to ensure the correct email address for verification." />
                            </SettingsValueRow.Label>
                            <SettingsValueRow.Description>
                                Used to sign in to your account.
                            </SettingsValueRow.Description>
                        </>
                    }
                    value="alice.anderson@proton.me"
                    action={
                        <SettingsValueRow.EditButton
                            title="Edit email address"
                            aria-label="Edit email address"
                            onClick={() => {}}
                        />
                    }
                />
            </SettingsIconRow>
        </Card>
    ),
};

export const WithoutValue: Story = {
    name: 'Without value (action next to label)',
    parameters: {
        docs: {
            description: {
                story: 'When no `value` is passed, the action moves next to the label instead of the value column — used for rows where the value cannot be displayed, such as a password.',
            },
        },
    },
    render: () => (
        <Card>
            <SettingsIconRow icon={IcPassword}>
                <SettingsValueRow
                    label={<SettingsValueRow.Label>Password</SettingsValueRow.Label>}
                    action={
                        <SettingsValueRow.EditButton
                            title="Change password"
                            aria-label="Change password"
                            onClick={() => {}}
                        />
                    }
                />
            </SettingsIconRow>
        </Card>
    ),
};

export const WithoutAction: Story = {
    render: () => (
        <Card>
            <SettingsIconRow icon={IcEnvelope}>
                <SettingsValueRow
                    label={<SettingsValueRow.Label>Email address</SettingsValueRow.Label>}
                    value="alice.anderson@proton.me"
                />
            </SettingsIconRow>
        </Card>
    ),
};

export const LongValue: Story = {
    name: 'Long value truncation',
    parameters: {
        docs: {
            description: {
                story: 'The value column truncates with an ellipsis rather than pushing the action out of the row.',
            },
        },
    },
    render: () => (
        <Card>
            <SettingsIconRow icon={IcEnvelope}>
                <SettingsValueRow
                    label={<SettingsValueRow.Label>Email address</SettingsValueRow.Label>}
                    value="alice.anderson.with.a.very.long.email.address@a-very-long-domain-name.example.com"
                    action={
                        <SettingsValueRow.EditButton
                            title="Edit email address"
                            aria-label="Edit email address"
                            onClick={() => {}}
                        />
                    }
                />
            </SettingsIconRow>
        </Card>
    ),
};

export const MultipleRows: Story = {
    name: 'Multiple rows in one card',
    render: () => (
        <Card>
            <SettingsIconRow icon={IcUserCircle}>
                <SettingsValueRow
                    label={<SettingsValueRow.Label>Username</SettingsValueRow.Label>}
                    value="alice.anderson@proton.me"
                    action={<SettingsValueRow.EditButton title="Edit username" onClick={() => {}} />}
                />
            </SettingsIconRow>

            <DashboardCardDivider />

            <SettingsIconRow icon={IcCardIdentity}>
                <SettingsValueRow
                    label={<SettingsValueRow.Label>Display name</SettingsValueRow.Label>}
                    value="Alice Anderson"
                    action={<SettingsValueRow.EditButton title="Edit display name" onClick={() => {}} />}
                />
            </SettingsIconRow>

            <DashboardCardDivider />

            <SettingsIconRow icon={IcPassword}>
                <SettingsValueRow
                    label={<SettingsValueRow.Label>Password</SettingsValueRow.Label>}
                    action={<SettingsValueRow.EditButton title="Change password" onClick={() => {}} />}
                />
            </SettingsIconRow>
        </Card>
    ),
};
