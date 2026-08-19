import { useState } from 'react';
import type { ReactNode } from 'react';

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { DashboardCard, DashboardCardContent, DashboardCardDivider } from '@proton/atoms/DashboardCard/DashboardCard';
import Option from '@proton/components/components/option/Option';
import { SettingsIconRow } from '@proton/components/containers/account/SettingsIconRow';
import { SettingsSelectRow } from '@proton/components/containers/account/SettingsSelectRow';
import { SettingsToggleRow } from '@proton/components/containers/account/SettingsToggleRow';
import { SettingsValueRow } from '@proton/components/containers/account/SettingsValueRow';
import { IcBell } from '@proton/icons/icons/IcBell';
import { IcLanguage } from '@proton/icons/icons/IcLanguage';
import { IcPassword } from '@proton/icons/icons/IcPassword';
import { IcUserCircle } from '@proton/icons/icons/IcUserCircle';

const Card = ({ children }: { children: ReactNode }) => (
    <div className="bg-weak p-4 md:p-8">
        <DashboardCard>
            <DashboardCardContent>{children}</DashboardCardContent>
        </DashboardCard>
    </div>
);

const meta: Meta<typeof SettingsIconRow> = {
    title: 'Components/Settings/Icon Row',
    component: SettingsIconRow,
    parameters: {
        docs: {
            description: {
                component:
                    'The two-column grid (`24px` icon + content) every settings row sits in. Pass the icon as a component, not an element — it is rendered internally at `size={6}` with weak color, so call sites never style it. Omitting `icon` keeps the column so rows stay aligned with their icon-bearing siblings. Use it inside `DashboardCard` / `DashboardCardContent`, one row per icon row, separated by `DashboardCardDivider`.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof SettingsIconRow>;

export const Default: Story = {
    render: () => (
        <Card>
            <SettingsIconRow icon={IcUserCircle}>
                <SettingsValueRow
                    label={<SettingsValueRow.Label>Username</SettingsValueRow.Label>}
                    value="alice.anderson@proton.me"
                    action={<SettingsValueRow.EditButton title="Edit username" onClick={() => {}} />}
                />
            </SettingsIconRow>
        </Card>
    ),
};

export const WithoutIcon: Story = {
    name: 'Without icon (column preserved)',
    parameters: {
        docs: {
            description: {
                story: 'The first row has no icon; its content still lines up with the row below, because an empty placeholder holds the icon column.',
            },
        },
    },
    render: () => (
        <Card>
            <SettingsIconRow>
                <SettingsValueRow
                    label={<SettingsValueRow.Label>Username</SettingsValueRow.Label>}
                    value="alice.anderson@proton.me"
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

export const NotCentered: Story = {
    name: 'centered={false}',
    parameters: {
        docs: {
            description: {
                story: 'By default the icon is vertically centered against the whole row. With `centered={false}` it aligns to the top of the content, which reads better when the description spans several lines.',
            },
        },
    },
    render: () => {
        const description =
            'Periodically prompts you to verify your Proton password to ensure you don’t forget it. You’ll be asked less frequently over time, and you can turn this off at any point.';

        return (
            <Card>
                <SettingsIconRow icon={IcBell}>
                    <SettingsToggleRow
                        id="centeredToggle"
                        label={
                            <>
                                <SettingsToggleRow.Label>Password check-ins (centered)</SettingsToggleRow.Label>
                                <SettingsToggleRow.Description>{description}</SettingsToggleRow.Description>
                            </>
                        }
                        toggle={<SettingsToggleRow.Toggle checked onChange={() => {}} />}
                    />
                </SettingsIconRow>

                <DashboardCardDivider />

                <SettingsIconRow icon={IcBell} centered={false}>
                    <SettingsToggleRow
                        id="notCenteredToggle"
                        label={
                            <>
                                <SettingsToggleRow.Label>Password check-ins (top aligned)</SettingsToggleRow.Label>
                                <SettingsToggleRow.Description>{description}</SettingsToggleRow.Description>
                            </>
                        }
                        toggle={<SettingsToggleRow.Toggle checked onChange={() => {}} />}
                    />
                </SettingsIconRow>
            </Card>
        );
    },
};

export const MixedRows: Story = {
    name: 'Mixed row types in one card',
    render: () => {
        const [checked, setChecked] = useState(true);
        const [language, setLanguage] = useState('en');

        return (
            <Card>
                <SettingsIconRow icon={IcUserCircle}>
                    <SettingsValueRow
                        label={<SettingsValueRow.Label>Username</SettingsValueRow.Label>}
                        value="alice.anderson@proton.me"
                        action={<SettingsValueRow.EditButton title="Edit username" onClick={() => {}} />}
                    />
                </SettingsIconRow>

                <DashboardCardDivider />

                <SettingsIconRow icon={IcLanguage}>
                    <SettingsSelectRow
                        id="mixedLanguageSelect"
                        label={<SettingsSelectRow.Label>Default language</SettingsSelectRow.Label>}
                        select={
                            <SettingsSelectRow.Select value={language} onValue={setLanguage}>
                                <Option title="English" value="en" />
                                <Option title="Deutsch" value="de" />
                                <Option title="Français" value="fr" />
                            </SettingsSelectRow.Select>
                        }
                    />
                </SettingsIconRow>

                <DashboardCardDivider />

                <SettingsIconRow icon={IcBell}>
                    <SettingsToggleRow
                        id="mixedRemindersToggle"
                        label={
                            <>
                                <SettingsToggleRow.Label>Password check-ins</SettingsToggleRow.Label>
                                <SettingsToggleRow.Description>
                                    Periodically prompts you to verify your password so you don’t forget it
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
