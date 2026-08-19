import { useState } from 'react';
import type { ReactNode } from 'react';

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { DashboardCard, DashboardCardContent, DashboardCardDivider } from '@proton/atoms/DashboardCard/DashboardCard';
import Option from '@proton/components/components/option/Option';
import { SettingsIconRow } from '@proton/components/containers/account/SettingsIconRow';
import { SettingsSelectRow } from '@proton/components/containers/account/SettingsSelectRow';
import { IcCalendarGrid } from '@proton/icons/icons/IcCalendarGrid';
import { IcClock } from '@proton/icons/icons/IcClock';
import { IcLanguage } from '@proton/icons/icons/IcLanguage';
import { IcTextSize } from '@proton/icons/icons/IcTextSize';

const Card = ({ children }: { children: ReactNode }) => (
    <div className="bg-weak p-4 md:p-8">
        <DashboardCard>
            <DashboardCardContent>{children}</DashboardCardContent>
        </DashboardCard>
    </div>
);

const meta: Meta<typeof SettingsSelectRow> = {
    title: 'Components/Settings/Select Row',
    component: SettingsSelectRow,
    parameters: {
        docs: {
            description: {
                component:
                    'A settings row pairing a label (and optional description) with a select. The `id` is shared through context so `SettingsSelectRow.Label` labels `SettingsSelectRow.Select`. The select column is capped at 15rem from `md` up and goes full width on mobile. Place the row inside a `SettingsIconRow` for the leading icon column and stack rows in a `DashboardCard` / `DashboardCardContent` separated by `DashboardCardDivider`.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof SettingsSelectRow>;

export const Default: Story = {
    render: () => {
        const [language, setLanguage] = useState('en');

        return (
            <Card>
                <SettingsIconRow icon={IcLanguage}>
                    <SettingsSelectRow
                        id="languageSelect"
                        label={
                            <SettingsSelectRow.Label id="label-languageSelect">
                                Default language
                            </SettingsSelectRow.Label>
                        }
                        select={
                            <SettingsSelectRow.Select
                                value={language}
                                onValue={setLanguage}
                                aria-describedby="label-languageSelect"
                            >
                                <Option title="English" value="en" />
                                <Option title="Deutsch" value="de" />
                                <Option title="Français" value="fr" />
                                <Option title="Čeština" value="cs" />
                            </SettingsSelectRow.Select>
                        }
                    />
                </SettingsIconRow>
            </Card>
        );
    },
};

export const WithDescription: Story = {
    render: () => {
        const [size, setSize] = useState('default');

        return (
            <Card>
                <SettingsIconRow icon={IcTextSize}>
                    <SettingsSelectRow
                        id="fontSizeSelect"
                        label={
                            <>
                                <SettingsSelectRow.Label>Font size</SettingsSelectRow.Label>
                                <SettingsSelectRow.Description>
                                    Applies to the whole application, on this device only
                                </SettingsSelectRow.Description>
                            </>
                        }
                        select={
                            <SettingsSelectRow.Select value={size} onValue={setSize}>
                                <Option title="Small" value="small" />
                                <Option title="Default" value="default" />
                                <Option title="Large" value="large" />
                            </SettingsSelectRow.Select>
                        }
                    />
                </SettingsIconRow>
            </Card>
        );
    },
};

export const WithRichOptions: Story = {
    parameters: {
        docs: {
            description: {
                story: '`SettingsSelectRow.Select` forwards every `SelectTwo` prop, so options can render custom content and the selected value can be rendered independently via `renderSelected`.',
            },
        },
    },
    render: () => {
        const [size, setSize] = useState(14);

        return (
            <Card>
                <SettingsIconRow icon={IcTextSize}>
                    <SettingsSelectRow
                        id="richFontSizeSelect"
                        label={<SettingsSelectRow.Label>Font size</SettingsSelectRow.Label>}
                        select={
                            <SettingsSelectRow.Select
                                value={size}
                                onValue={setSize}
                                renderSelected={(selected) => <>{selected}px</>}
                            >
                                {[12, 14, 16, 18].map((value) => (
                                    <Option
                                        key={value}
                                        title={`${value}px`}
                                        value={value}
                                        className="flex flex-nowrap items-center gap-2"
                                    >
                                        <span
                                            className="shrink-0 w-custom text-center text-bold"
                                            style={{ fontSize: `${value / 14}em`, '--w-custom': '1.5rem' }}
                                        >
                                            Aa
                                        </span>
                                        <span className="flex-1">{value}px</span>
                                    </Option>
                                ))}
                            </SettingsSelectRow.Select>
                        }
                    />
                </SettingsIconRow>
            </Card>
        );
    },
};

export const MultipleRows: Story = {
    name: 'Multiple rows in one card',
    render: () => {
        const [dateFormat, setDateFormat] = useState('locale');
        const [timeFormat, setTimeFormat] = useState('24');
        const [weekStart, setWeekStart] = useState('monday');

        return (
            <Card>
                <SettingsIconRow icon={IcCalendarGrid}>
                    <SettingsSelectRow
                        id="dateFormatSelect"
                        label={<SettingsSelectRow.Label>Date format</SettingsSelectRow.Label>}
                        select={
                            <SettingsSelectRow.Select value={dateFormat} onValue={setDateFormat}>
                                <Option title="Based on my language" value="locale" />
                                <Option title="DD/MM/YYYY" value="ddmmyyyy" />
                                <Option title="MM/DD/YYYY" value="mmddyyyy" />
                            </SettingsSelectRow.Select>
                        }
                    />
                </SettingsIconRow>

                <DashboardCardDivider />

                <SettingsIconRow icon={IcClock}>
                    <SettingsSelectRow
                        id="timeFormatSelect"
                        label={<SettingsSelectRow.Label>Time format</SettingsSelectRow.Label>}
                        select={
                            <SettingsSelectRow.Select value={timeFormat} onValue={setTimeFormat}>
                                <Option title="24-hour" value="24" />
                                <Option title="12-hour" value="12" />
                            </SettingsSelectRow.Select>
                        }
                    />
                </SettingsIconRow>

                <DashboardCardDivider />

                <SettingsIconRow icon={IcCalendarGrid}>
                    <SettingsSelectRow
                        id="weekStartSelect"
                        label={<SettingsSelectRow.Label>Week start</SettingsSelectRow.Label>}
                        select={
                            <SettingsSelectRow.Select value={weekStart} onValue={setWeekStart}>
                                <Option title="Monday" value="monday" />
                                <Option title="Saturday" value="saturday" />
                                <Option title="Sunday" value="sunday" />
                            </SettingsSelectRow.Select>
                        }
                    />
                </SettingsIconRow>
            </Card>
        );
    },
};
