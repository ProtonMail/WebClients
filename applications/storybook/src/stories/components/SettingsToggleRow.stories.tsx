import { useState } from 'react';
import type { ReactNode } from 'react';

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { DashboardCard, DashboardCardContent, DashboardCardDivider } from '@proton/atoms/DashboardCard/DashboardCard';
import { Href } from '@proton/atoms/Href/Href';
import { SettingsIconRow } from '@proton/components/containers/account/SettingsIconRow';
import { SettingsToggleRow } from '@proton/components/containers/account/SettingsToggleRow';
import { useLoading } from '@proton/hooks';
import { IcBell } from '@proton/icons/icons/IcBell';
import { IcPinCode } from '@proton/icons/icons/IcPinCode';
import { IcSecurityKey } from '@proton/icons/icons/IcSecurityKey';
import { wait } from '@proton/shared/lib/helpers/promise';

const Card = ({ children }: { children: ReactNode }) => (
    <div className="bg-weak p-4 md:p-8">
        <DashboardCard>
            <DashboardCardContent>{children}</DashboardCardContent>
        </DashboardCard>
    </div>
);

const meta: Meta<typeof SettingsToggleRow> = {
    title: 'Components/Settings/Toggle Row',
    component: SettingsToggleRow,
    parameters: {
        docs: {
            description: {
                component:
                    'A settings row pairing a label (and optional description) with a toggle. The `id` is shared through context so `SettingsToggleRow.Label` labels `SettingsToggleRow.Toggle` — clicking the label text flips the toggle. Place it inside a `SettingsIconRow` for the leading icon column and stack rows in a `DashboardCard` / `DashboardCardContent` separated by `DashboardCardDivider`.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof SettingsToggleRow>;

export const Default: Story = {
    render: () => {
        const [checked, setChecked] = useState(true);

        return (
            <Card>
                <SettingsIconRow icon={IcPinCode}>
                    <SettingsToggleRow
                        id="authenticatorAppToggle"
                        label={<SettingsToggleRow.Label>Authenticator app</SettingsToggleRow.Label>}
                        toggle={
                            <SettingsToggleRow.Toggle
                                checked={checked}
                                onChange={({ target }) => setChecked(target.checked)}
                            />
                        }
                    />
                </SettingsIconRow>
            </Card>
        );
    },
};

export const WithDescription: Story = {
    render: () => {
        const [checked, setChecked] = useState(false);

        return (
            <Card>
                <SettingsIconRow icon={IcSecurityKey}>
                    <SettingsToggleRow
                        id="securityKeyToggle"
                        label={
                            <>
                                <SettingsToggleRow.Label>Security key</SettingsToggleRow.Label>
                                <SettingsToggleRow.Description>
                                    Verify your identity with a physical U2F or FIDO2 security key
                                </SettingsToggleRow.Description>
                            </>
                        }
                        toggle={
                            <SettingsToggleRow.Toggle
                                checked={checked}
                                onChange={({ target }) => setChecked(target.checked)}
                            />
                        }
                    />
                </SettingsIconRow>
            </Card>
        );
    },
};

export const WithLinkInDescription: Story = {
    render: () => {
        const [checked, setChecked] = useState(false);

        return (
            <Card>
                <SettingsIconRow icon={IcPinCode}>
                    <SettingsToggleRow
                        id="twoPasswordModeToggle"
                        label={
                            <>
                                <SettingsToggleRow.Label>Two-password mode</SettingsToggleRow.Label>
                                <SettingsToggleRow.Description>
                                    Two-password mode requires two passwords: one to sign in to your account and one to
                                    decrypt your data. (Advanced){' '}
                                    <Href href="https://proton.me/support/switch-two-password-mode">Learn more</Href>
                                </SettingsToggleRow.Description>
                            </>
                        }
                        toggle={
                            <SettingsToggleRow.Toggle
                                checked={checked}
                                onChange={({ target }) => setChecked(target.checked)}
                            />
                        }
                    />
                </SettingsIconRow>
            </Card>
        );
    },
};

export const Loading: Story = {
    parameters: {
        docs: {
            description: {
                story: 'While the request is in flight the toggle shows a loader and ignores further interaction.',
            },
        },
    },
    render: () => {
        const [checked, setChecked] = useState(false);
        const [loading, withLoading] = useLoading(false);

        return (
            <Card>
                <SettingsIconRow icon={IcBell}>
                    <SettingsToggleRow
                        id="loadingToggle"
                        label={
                            <>
                                <SettingsToggleRow.Label>Password reminders</SettingsToggleRow.Label>
                                <SettingsToggleRow.Description>
                                    Toggling saves the preference to the API — the toggle stays in a loading state until
                                    it resolves
                                </SettingsToggleRow.Description>
                            </>
                        }
                        toggle={
                            <SettingsToggleRow.Toggle
                                loading={loading}
                                checked={checked}
                                onChange={() => {
                                    void withLoading(
                                        (async () => {
                                            await wait(1000);
                                            setChecked((old) => !old);
                                        })()
                                    );
                                }}
                            />
                        }
                    />
                </SettingsIconRow>
            </Card>
        );
    },
};

export const Disabled: Story = {
    render: () => (
        <Card>
            <SettingsIconRow icon={IcPinCode}>
                <SettingsToggleRow
                    id="disabledToggle"
                    label={
                        <>
                            <SettingsToggleRow.Label className="color-weak">Disable animations</SettingsToggleRow.Label>
                            <SettingsToggleRow.Description>
                                The reduce motion setting is already enabled on this device
                            </SettingsToggleRow.Description>
                        </>
                    }
                    toggle={<SettingsToggleRow.Toggle checked disabled onChange={() => {}} />}
                />
            </SettingsIconRow>
        </Card>
    ),
};

export const WithoutIconRow: Story = {
    name: 'Without SettingsIconRow',
    parameters: {
        docs: {
            description: {
                story: 'The recovery subpages place the toggle row directly in the card content, without the leading icon column.',
            },
        },
    },
    render: () => {
        const [checked, setChecked] = useState(true);

        return (
            <Card>
                <SettingsToggleRow
                    id="deviceRecoveryToggle"
                    label={<SettingsToggleRow.Label>Allow recovery using a trusted device</SettingsToggleRow.Label>}
                    toggle={
                        <SettingsToggleRow.Toggle
                            checked={checked}
                            onChange={({ target }) => setChecked(target.checked)}
                        />
                    }
                />
            </Card>
        );
    },
};

export const MultipleRows: Story = {
    name: 'Multiple rows in one card',
    render: () => {
        const [totp, setTotp] = useState(true);
        const [securityKey, setSecurityKey] = useState(false);
        const [requirePin, setRequirePin] = useState(false);

        return (
            <Card>
                <SettingsIconRow icon={IcPinCode}>
                    <SettingsToggleRow
                        id="multiTotpToggle"
                        label={
                            <>
                                <SettingsToggleRow.Label>Authenticator app</SettingsToggleRow.Label>
                                <SettingsToggleRow.Description>
                                    Verify your identity with a time-based one-time password from an authenticator app
                                </SettingsToggleRow.Description>
                            </>
                        }
                        toggle={
                            <SettingsToggleRow.Toggle
                                checked={totp}
                                onChange={({ target }) => setTotp(target.checked)}
                            />
                        }
                    />
                </SettingsIconRow>

                <DashboardCardDivider />

                <SettingsIconRow icon={IcSecurityKey}>
                    <SettingsToggleRow
                        id="multiSecurityKeyToggle"
                        label={
                            <>
                                <SettingsToggleRow.Label>Security key</SettingsToggleRow.Label>
                                <SettingsToggleRow.Description>
                                    Verify your identity with a physical U2F or FIDO2 security key
                                </SettingsToggleRow.Description>
                            </>
                        }
                        toggle={
                            <SettingsToggleRow.Toggle
                                checked={securityKey}
                                onChange={({ target }) => setSecurityKey(target.checked)}
                            />
                        }
                    />
                </SettingsIconRow>

                <DashboardCardDivider />

                <SettingsIconRow icon={IcPinCode}>
                    <SettingsToggleRow
                        id="multiRequirePinToggle"
                        label={<SettingsToggleRow.Label>Require PIN for security key</SettingsToggleRow.Label>}
                        toggle={
                            <SettingsToggleRow.Toggle
                                checked={requirePin}
                                onChange={({ target }) => setRequirePin(target.checked)}
                            />
                        }
                    />
                </SettingsIconRow>
            </Card>
        );
    },
};
