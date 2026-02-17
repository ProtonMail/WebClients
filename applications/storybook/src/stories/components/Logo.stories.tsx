import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-webpack5';

import RadioGroup from '@proton/components/components/input/RadioGroup';
import CalendarLogo from '@proton/components/components/logo/CalendarLogo';
import DriveLogo from '@proton/components/components/logo/DriveLogo';
import type { LogoProps } from '@proton/components/components/logo/Logo';
import Logo from '@proton/components/components/logo/Logo';
import MailLogo from '@proton/components/components/logo/MailLogo';
import PassLogo from '@proton/components/components/logo/PassLogo';
import ProtonLogo from '@proton/components/components/logo/ProtonLogo';
import VpnLogo from '@proton/components/components/logo/VpnLogo';
import VpnPassLogo from '@proton/components/components/logo/VpnPassLogo';
import WalletLogo from '@proton/components/components/logo/WalletLogo';
import { APPS } from '@proton/shared/lib/constants';

const appNames: Required<LogoProps>['appName'][] = [
    APPS.PROTONMAIL,
    APPS.PROTONCALENDAR,
    APPS.PROTONDRIVE,
    APPS.PROTONVPN_SETTINGS,
    APPS.PROTONPASS,
    APPS.PROTONDOCS,
    APPS.PROTONWALLET,
];

const variants: Required<LogoProps>['variant'][] = ['with-wordmark', 'glyph-only', 'wordmark-only'];

const meta: Meta<typeof Logo> = {
    title: 'Components/Logo',
    args: {
        appName: APPS.PROTONMAIL,
        variant: 'with-wordmark',
    },
    component: Logo,
    parameters: {
        docs: {
            description: {
                component:
                    'Renders Proton app and brand logos. Supports all app names, multiple variants (with-wordmark, glyph-only, wordmark-only), and custom sizing.',
            },
        },
    },
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof Logo>;

export const Default: Story = {};

export const GlyphOnly: Story = {
    args: {
        appName: APPS.PROTONMAIL,
        variant: 'glyph-only',
    },
};

export const WordmarkOnly: Story = {
    args: {
        appName: APPS.PROTONMAIL,
        variant: 'wordmark-only',
    },
};

export const Sandbox: Story = {
    render: () => {
        const [selectedAppName, setSelectedAppName] = useState<Required<LogoProps>['appName']>(APPS.PROTONMAIL);
        const [selectedVariant, setSelectedVariant] = useState<Required<LogoProps>['variant']>('with-wordmark');

        return (
            <div className="my-8">
                <div className="flex items-stretch">
                    <div className="mr-8">
                        <strong className="block mb-4">App Name</strong>
                        <RadioGroup
                            name="selected-app-name"
                            onChange={setSelectedAppName}
                            value={selectedAppName}
                            options={appNames.map((appName) => ({ value: appName, label: appName }))}
                        />
                    </div>
                    <div className="mr-8">
                        <strong className="block mb-4">Variant</strong>
                        <RadioGroup
                            name="selected-variant"
                            onChange={setSelectedVariant}
                            value={selectedVariant}
                            options={variants.map((variant) => ({ value: variant, label: variant }))}
                        />
                    </div>
                    <div className="flex flex-1 items-center justify-center border">
                        <Logo appName={selectedAppName} variant={selectedVariant} />
                    </div>
                </div>
            </div>
        );
    },
};

export const Individual: Story = {
    render: () => (
        <div className="flex flex-column gap-8">
            <ProtonLogo variant="glyph-only" />
            <ProtonLogo />
            <MailLogo />
            <CalendarLogo />
            <DriveLogo />
            <VpnLogo />
            <PassLogo />
            <WalletLogo />
            <VpnPassLogo />
        </div>
    ),
};
