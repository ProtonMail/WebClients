import { useState } from 'react';

import {
    CalendarLogo,
    DriveLogo,
    Logo,
    LogoProps,
    MailLogo,
    ProtonLogo,
    RadioGroup,
    VpnLogo,
} from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';

import { getTitle } from '../../helpers/title';
import mdx from './Logo.mdx';

export default {
    component: Logo,
    title: getTitle(__filename, false),
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
];

const variants: Required<LogoProps>['variant'][] = ['with-wordmark', 'glyph-only'];

export const Sandbox = () => {
    const [selectedAppName, setSelectedAppName] = useState<Required<LogoProps>['appName']>(APPS.PROTONMAIL);
    const [selectedVariant, setSelectedVariant] = useState<Required<LogoProps>['variant']>('with-wordmark');

    const logo = <Logo appName={selectedAppName} variant={selectedVariant} />;

    return (
        <div className="my2">
            <div className="flex flex-align-items-stretch">
                <div className="mr2">
                    <strong className="block mb1">App Name</strong>
                    <RadioGroup
                        name="selected-app-name"
                        onChange={setSelectedAppName}
                        value={selectedAppName}
                        options={appNames.map((appName) => ({ value: appName, label: appName }))}
                    />
                </div>
                <div className="mr2">
                    <strong className="block mb1">Variant</strong>
                    <RadioGroup
                        name="selected-variant"
                        onChange={setSelectedVariant}
                        value={selectedVariant}
                        options={variants.map((variant) => ({ value: variant, label: variant }))}
                    />
                </div>
                <div className="flex flex-item-fluid flex-align-items-center flex-justify-center border">{logo}</div>
            </div>
        </div>
    );
};

export const Individual = () => (
    <div>
        <div className="mb2">
            <ProtonLogo variant="glyph-only" />
        </div>
        <div className="mb2">
            <ProtonLogo />
        </div>
        <div className="mb2">
            <MailLogo />
        </div>
        <div className="mb2">
            <CalendarLogo />
        </div>
        <div className="mb2">
            <DriveLogo />
        </div>
        <div>
            <VpnLogo />
        </div>
    </div>
);
