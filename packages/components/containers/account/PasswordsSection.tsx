import React, { useEffect } from 'react';
import { c } from 'ttag';
import { SETTINGS_PASSWORD_MODE } from 'proton-shared/lib/interfaces';

import { Button, Info, Loader, Toggle } from '../../components';
import { useAddresses, useModals, useUserSettings } from '../../hooks';

import ChangePasswordModal, { MODES } from './ChangePasswordModal';
import TwoFactorSection from './TwoFactorSection';
import SettingsSection from './SettingsSection';
import SettingsLayout from './SettingsLayout';
import SettingsLayoutLeft from './SettingsLayoutLeft';
import SettingsLayoutRight from './SettingsLayoutRight';

interface Props {
    open?: boolean;
}

const PasswordsSection = ({ open }: Props) => {
    const [userSettings, loadingUserSettings] = useUserSettings();
    const [addresses, loadingAddresses] = useAddresses();
    const { createModal } = useModals();

    const isOnePasswordMode = userSettings?.Password?.Mode === SETTINGS_PASSWORD_MODE.ONE_PASSWORD_MODE;
    const passwordLabel = isOnePasswordMode ? c('Title').t`Password` : c('Title').t`Login password`;
    const passwordButtonLabel = isOnePasswordMode ? c('Title').t`Change password` : c('Title').t`Change login password`;
    const changePasswordMode = isOnePasswordMode
        ? MODES.CHANGE_ONE_PASSWORD_MODE
        : MODES.CHANGE_TWO_PASSWORD_LOGIN_MODE;
    const loading = loadingUserSettings || loadingAddresses;

    const handleChangePassword = (mode: MODES) => {
        createModal(<ChangePasswordModal mode={mode} />, 'change-password');
    };

    useEffect(() => {
        if (open && !loading) {
            handleChangePassword(changePasswordMode);
        }
    }, [loading]);

    if (loading) {
        return <Loader />;
    }

    // VPN users are by default in two password mode, even if they don't have any addresses. Don't allow them to change two-password mode.
    const hasAddresses = Array.isArray(addresses) && addresses.length > 0;

    return (
        <SettingsSection>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label htmlFor="passwordChange" className="text-semibold">
                        {passwordLabel}
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight>
                    <Button color="norm" onClick={() => handleChangePassword(changePasswordMode)}>
                        {passwordButtonLabel}
                    </Button>
                </SettingsLayoutRight>
            </SettingsLayout>
            <TwoFactorSection />
            {hasAddresses && (
                <>
                    <SettingsLayout>
                        <SettingsLayoutLeft>
                            <label htmlFor="passwordModeToggle" className="text-semibold">
                                <span className="mr0-5">{c('Label').t`Two-password mode`}</span>
                                <Info
                                    url="https://protonmail.com/support/knowledge-base/single-password"
                                    title={c('Info')
                                        .t`Two-password mode requires two passwords: one to log in to your account and one to decrypt your mailbox. (Advanced)`}
                                />
                            </label>
                        </SettingsLayoutLeft>
                        <SettingsLayoutRight className="pt0-5">
                            <Toggle
                                loading={loadingUserSettings}
                                checked={!isOnePasswordMode}
                                id="passwordModeToggle"
                                onChange={() =>
                                    handleChangePassword(
                                        isOnePasswordMode ? MODES.SWITCH_TWO_PASSWORD : MODES.SWITCH_ONE_PASSWORD
                                    )
                                }
                            />
                        </SettingsLayoutRight>
                    </SettingsLayout>
                    {!isOnePasswordMode && (
                        <SettingsLayout>
                            <SettingsLayoutLeft>
                                <label htmlFor="passwordModeToggle" className="text-semibold">
                                    <span className="mr0-5">{c('Label').t`Mailbox password`}</span>
                                    <Info url="https://protonmail.com/support/knowledge-base/single-password" />
                                </label>
                            </SettingsLayoutLeft>
                            <SettingsLayoutRight>
                                <Button
                                    color="norm"
                                    onClick={() => handleChangePassword(MODES.CHANGE_TWO_PASSWORD_MAILBOX_MODE)}
                                >
                                    {c('Action').t`Change mailbox password`}
                                </Button>
                            </SettingsLayoutRight>
                        </SettingsLayout>
                    )}
                </>
            )}
        </SettingsSection>
    );
};

export default PasswordsSection;
