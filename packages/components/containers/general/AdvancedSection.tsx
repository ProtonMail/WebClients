import React, { useState, useEffect } from 'react';
import { c } from 'ttag';

import { getCookie, setCookie } from 'proton-shared/lib/helpers/cookies';

import { Info, FakeSelectChangeEvent, Option, SelectTwo, Toggle, Button } from '../../components';
import { useEarlyAccess, useModals, useMailSettings } from '../../hooks';
import { SettingsSection } from '../account';

import EarlyAccessSwitchModal, { Environment } from './EarlyAccessSwitchModal';
import ShortcutsToggle from './ShortcutsToggle';
import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutRight from '../account/SettingsLayoutRight';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import { MailShortcutsModal } from '../mail';

const AdvancedSection = () => {
    const { createModal } = useModals();

    const [{ Shortcuts = 1 } = {}] = useMailSettings();
    const [, setShortcuts] = useState(Shortcuts);
    const [environment, setEnvironment] = useState(() => (getCookie('Version') || 'prod') as Environment);

    const { hasAlphaAccess } = useEarlyAccess();

    const confirmEnvironmentSwitch = (toEnvironment: Environment) => {
        return new Promise<void>((resolve, reject) => {
            createModal(
                <EarlyAccessSwitchModal
                    fromEnvironment={environment}
                    toEnvironment={toEnvironment}
                    onConfirm={resolve}
                    onCancel={reject}
                />
            );
        });
    };

    const updateVersionCookie = (env: Environment) => {
        if (['alpha', 'beta'].includes(env)) {
            setCookie({
                cookieName: 'Version',
                cookieValue: env,
                expirationDate: 'max',
                path: '/',
            });
        } else {
            setCookie({
                cookieName: 'Version',
                cookieValue: undefined,
                path: '/',
            });
        }
    };

    const handleToggleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const env = e.target.checked ? 'beta' : 'prod';
        await confirmEnvironmentSwitch(env);
        setEnvironment(env);
        updateVersionCookie(env);
        window.location.reload();
    };

    const handleSelectChange = async ({ value }: FakeSelectChangeEvent<Environment>) => {
        await confirmEnvironmentSwitch(value);
        setEnvironment(value);
        updateVersionCookie(value);
        window.location.reload();
    };

    const openShortcutsModal = () => {
        createModal(<MailShortcutsModal />, 'shortcuts-modal');
    };

    // Handle updates from the Event Manager.
    useEffect(() => {
        setShortcuts(Shortcuts);
    }, [Shortcuts]);

    return (
        <SettingsSection>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="shortcutsToggle" className="text-semibold">
                        {c('Title').t`Enable keyboard shortcuts`}
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight className="flex flex-item-fluid flex-justify-space-between flex-align-items-center">
                    <ShortcutsToggle className="mr1" id="shortcutsToggle" />
                    <Button
                        shape="outline"
                        onClick={openShortcutsModal}
                        className="flex-item-noshrink flex-item-nogrow"
                    >
                        {c('Action').t`Show shortcuts`}
                    </Button>
                </SettingsLayoutRight>
            </SettingsLayout>

            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="betaToggle" className="text-semibold">
                        {hasAlphaAccess ? (
                            <span className="mr0-5">{c('Label').t`Application Version`}</span>
                        ) : (
                            <>
                                <span className="mr0-5">{c('Label').t`Join the beta program`}</span>
                                <Info
                                    title={c('Info')
                                        .t`ProtonMail beta testers get early access to new features and take part in the development of our products.`}
                                />
                            </>
                        )}
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight>
                    {hasAlphaAccess ? (
                        <SelectTwo onChange={handleSelectChange} value={environment}>
                            <Option value="prod" title={c('Environment').t`Live (Default)`} />
                            <Option value="beta" title={c('Environment').t`Beta`} />
                            <Option value="alpha" title={c('Environment').t`Alpha`} />
                        </SelectTwo>
                    ) : (
                        <div className="pt0-5">
                            <Toggle id="betaToggle" checked={environment === 'beta'} onChange={handleToggleChange} />
                        </div>
                    )}
                </SettingsLayoutRight>
            </SettingsLayout>
        </SettingsSection>
    );
};

export default AdvancedSection;
