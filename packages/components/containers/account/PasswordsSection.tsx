import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { SETTINGS_PASSWORD_MODE } from '@proton/shared/lib/interfaces';

import { Info, Loader, Toggle } from '../../components';
import useModalState from '../../components/modalTwo/useModalState';
import {
    useAvailableRecoveryMethods,
    useIsSessionRecoveryInitiationAvailable,
    useSearchParamsEffect,
    useUser,
    useUserSettings,
} from '../../hooks';
import ChangePasswordModal, { MODES } from './ChangePasswordModal';
import ReauthUsingRecoveryModal from './ReauthUsingRecoveryModal';
import SettingsLayout from './SettingsLayout';
import SettingsLayoutLeft from './SettingsLayoutLeft';
import SettingsLayoutRight from './SettingsLayoutRight';
import SettingsSection from './SettingsSection';
import InitiateSessionRecoveryModal from './sessionRecovery/InitiateSessionRecoveryModal';
import PasswordResetAvailableAccountModal from './sessionRecovery/PasswordResetAvailableAccountModal';
import { useSessionRecoveryLocalStorage } from './sessionRecovery/SessionRecoveryLocalStorageManager';

const PasswordsSection = () => {
    const [user, loadingUser] = useUser();
    const [userSettings, loadingUserSettings] = useUserSettings();

    const [availableRecoveryMethods] = useAvailableRecoveryMethods();
    const hasRecoveryMethod = availableRecoveryMethods.length > 0;
    const isSessionRecoveryInitiationAvailable = useIsSessionRecoveryInitiationAvailable();

    const [tmpPasswordMode, setTmpPasswordMode] = useState<MODES>();
    const [changePasswordModal, setChangePasswordModalOpen, renderChangePasswordModal] = useModalState();
    const [
        changePasswordAfterReauthModal,
        setChangePasswordAfterReauthModalOpen,
        renderChangePasswordAfterReauthModal,
    ] = useModalState();
    const [sessionRecoveryModal, setSessionRecoveryModalOpen, renderSessionRecoveryModal] = useModalState();
    const [recoveryModal, setRecoveryModalOpen, renderRecoveryModal] = useModalState();
    const [
        sessionRecoveryPasswordResetModal,
        setSessionRecoveryPasswordResetModalOpen,
        renderSessionRecoveryPasswordResetModal,
    ] = useModalState();

    const { dismissSessionRecoveryCancelled } = useSessionRecoveryLocalStorage();
    const [skipInfoStep, setSkipInfoStep] = useState(false);

    const isOnePasswordMode = userSettings?.Password?.Mode === SETTINGS_PASSWORD_MODE.ONE_PASSWORD_MODE;
    const passwordLabel = isOnePasswordMode ? c('Title').t`Password` : c('Title').t`Main password`;
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
            if (loading) {
                return;
            }
            const action = params.get('action');

            if (!action) {
                return;
            }

            if (action === 'change-password') {
                handleChangePassword(changePasswordMode);
            } else if (action === 'session-recovery-password-reset-available') {
                setSkipInfoStep(false);
                setSessionRecoveryPasswordResetModalOpen(true);
            } else if (action === 'session-recovery-reset-password') {
                setSkipInfoStep(true);
                setSessionRecoveryPasswordResetModalOpen(true);
            }

            params.delete('action');
            return params;
        },
        [loading]
    );

    if (loading) {
        return <Loader />;
    }

    // Users without any keys setup are by default in two password mode, even if they have an address.
    // Don't allow them to change two-password mode.
    const hasTwoPasswordOption = user.Keys.length > 0;

    const onRecoveryClick = (() => {
        if (hasRecoveryMethod) {
            return () => {
                changePasswordModal.onClose();
                setRecoveryModalOpen(true);
            };
        }

        if (isSessionRecoveryInitiationAvailable) {
            return () => {
                changePasswordModal.onClose();
                setSessionRecoveryModalOpen(true);
            };
        }

        return undefined;
    })();

    return (
        <>
            {renderChangePasswordModal && tmpPasswordMode && (
                <ChangePasswordModal
                    mode={tmpPasswordMode}
                    onRecoveryClick={onRecoveryClick}
                    onSuccess={() => {
                        dismissSessionRecoveryCancelled();
                    }}
                    {...changePasswordModal}
                />
            )}
            {renderSessionRecoveryModal && (
                <InitiateSessionRecoveryModal
                    onUseRecoveryMethodClick={() => {
                        sessionRecoveryModal.onClose();
                        setRecoveryModalOpen(true);
                    }}
                    {...sessionRecoveryModal}
                />
            )}
            {renderRecoveryModal && (
                <ReauthUsingRecoveryModal
                    availableRecoveryMethods={availableRecoveryMethods}
                    onBack={() => {
                        recoveryModal.onClose();
                        setChangePasswordModalOpen(true);
                    }}
                    onInitiateSessionRecoveryClick={() => {
                        recoveryModal.onClose();
                        setSessionRecoveryModalOpen(true);
                    }}
                    onSuccess={() => setChangePasswordAfterReauthModalOpen(true)}
                    {...recoveryModal}
                />
            )}
            {renderChangePasswordAfterReauthModal && (
                <ChangePasswordModal
                    mode={MODES.CHANGE_ONE_PASSWORD_MODE}
                    signedInRecoveryFlow
                    {...changePasswordAfterReauthModal}
                />
            )}
            {renderSessionRecoveryPasswordResetModal && (
                <PasswordResetAvailableAccountModal
                    skipInfoStep={skipInfoStep}
                    {...sessionRecoveryPasswordResetModal}
                />
            )}
            <SettingsSection>
                <SettingsLayout>
                    <SettingsLayoutLeft>
                        <label htmlFor="passwordChange" className="text-semibold">
                            {passwordLabel}
                        </label>
                    </SettingsLayoutLeft>
                    <SettingsLayoutRight>
                        <Button onClick={() => handleChangePassword(changePasswordMode)}>{passwordButtonLabel}</Button>
                    </SettingsLayoutRight>
                </SettingsLayout>
                {hasTwoPasswordOption && (
                    <>
                        <SettingsLayout>
                            <SettingsLayoutLeft>
                                <label htmlFor="passwordModeToggle" className="text-semibold">
                                    <span className="mr-2">{c('Label').t`Two-password mode`}</span>
                                    <Info
                                        url={getKnowledgeBaseUrl('/single-password')}
                                        title={c('Info')
                                            .t`Two-password mode requires two passwords: one to sign in to your account and one to decrypt your data. (Advanced)`}
                                    />
                                </label>
                            </SettingsLayoutLeft>
                            <SettingsLayoutRight isToggleContainer>
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
                                        <span className="mr-2">{c('Label').t`Second password`}</span>
                                        <Info url={getKnowledgeBaseUrl('/single-password')} />
                                    </label>
                                </SettingsLayoutLeft>
                                <SettingsLayoutRight>
                                    <Button
                                        onClick={() => handleChangePassword(MODES.CHANGE_TWO_PASSWORD_MAILBOX_MODE)}
                                    >
                                        {c('Action').t`Change second password`}
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
