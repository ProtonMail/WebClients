import { useState } from 'react';

import { c } from 'ttag';

import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { SETTINGS_PASSWORD_MODE } from '@proton/shared/lib/interfaces';

import { Button, Info, Loader, Toggle } from '../../components';
import useModalState from '../../components/modalTwo/useModalState';
import { useSearchParamsEffect, useUser, useUserSettings } from '../../hooks';
import ChangePasswordModal, { MODES } from './ChangePasswordModal';
import SettingsLayout from './SettingsLayout';
import SettingsLayoutLeft from './SettingsLayoutLeft';
import SettingsLayoutRight from './SettingsLayoutRight';
import SettingsSection from './SettingsSection';
import TwoFactorSection from './TwoFactorSection';

const PasswordsSection = () => {
    const [user, loadingUser] = useUser();
    const [userSettings, loadingUserSettings] = useUserSettings();

    const [tmpPasswordMode, setTmpPasswordMode] = useState<MODES>();
    const [changePasswordModal, setChangePasswordModalOpen, render] = useModalState();

    const isOnePasswordMode = userSettings?.Password?.Mode === SETTINGS_PASSWORD_MODE.ONE_PASSWORD_MODE;
    const passwordLabel = isOnePasswordMode ? c('Title').t`Password` : c('Title').t`Login password`;
    const passwordButtonLabel = isOnePasswordMode ? c('Title').t`Change password` : c('Title').t`Change login password`;
    const changePasswordMode = isOnePasswordMode
        ? MODES.CHANGE_ONE_PASSWORD_MODE
        : MODES.CHANGE_TWO_PASSWORD_LOGIN_MODE;
    const loading = loadingUserSettings || loadingUser;

    const handleChangePassword = (mode: MODES) => {
        setTmpPasswordMode(mode);
        setChangePasswordModalOpen(true);
    };

    useSearchParamsEffect(
        (params) => {
            if (!loading && params.get('action') === 'change-password') {
                handleChangePassword(changePasswordMode);
                params.delete('action');
                return params;
            }
        },
        [loading]
    );

    if (loading) {
        return <Loader />;
    }

    // Users without any keys setup are by default in two password mode, even if they have an address.
    // Don't allow them to change two-password mode.
    const hasTwoPasswordOption = user.Keys.length > 0;

    return (
        <>
            {render && tmpPasswordMode && <ChangePasswordModal mode={tmpPasswordMode} {...changePasswordModal} />}
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
                {hasTwoPasswordOption && (
                    <>
                        <SettingsLayout>
                            <SettingsLayoutLeft>
                                <label htmlFor="passwordModeToggle" className="text-semibold">
                                    <span className="mr0-5">{c('Label').t`Two-password mode`}</span>
                                    <Info
                                        url={getKnowledgeBaseUrl('/single-password')}
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
                                        <Info url={getKnowledgeBaseUrl('/single-password')} />
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
        </>
    );
};

export default PasswordsSection;
