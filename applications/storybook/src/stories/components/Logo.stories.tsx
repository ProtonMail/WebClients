import { useState } from 'react';

import type { LogoProps } from '@proton/components';
import {
    CalendarLogo,
    DriveLogo,
    Logo,
    MailLogo,
    PassLogo,
    ProtonLogo,
    RadioGroup,
    VpnLogo,
    WalletLogo,
} from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';

import mdx from './Logo.mdx';

export default {
    component: Logo,
    title: 'Components/Logo',
    parameters: {
        docs: {
            page: mdx,
        },
    },
};

export const Basic = ({ ...args }: LogoProps) => <Logo {...args} />;

Basic.args = {
    appName: APPS.PROTONMAIL,
    variant: 'with-wordmark',
} as LogoProps;

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

export const Sandbox = () => {
    const [selectedAppName, setSelectedAppName] = useState<Required<LogoProps>['appName']>(APPS.PROTONMAIL);
    const [selectedVariant, setSelectedVariant] = useState<Required<LogoProps>['variant']>('with-wordmark');

    const logo = <Logo appName={selectedAppName} variant={selectedVariant} />;

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
                <div className="flex flex-1 items-center justify-center border">{logo}</div>
            </div>
        </div>
    );
};

export const Individual = () => (
    <div className="flex flex-column gap-8">
        <ProtonLogo variant="glyph-only" />
        <ProtonLogo />
        <MailLogo />
        <CalendarLogo />
        <DriveLogo />
        <VpnLogo />
        <PassLogo />
        <WalletLogo />
    </div>
);
