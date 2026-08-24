import { useState } from 'react';

import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { useSessionRecoveryLocalStorage } from '@proton/account/recovery/sessionRecoveryHooks';
import {
    selectAvailableRecoveryMethods,
    selectSessionRecoveryData,
} from '@proton/account/recovery/sessionRecoverySelectors';
import { useUser } from '@proton/account/user/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import { DashboardCard, DashboardCardContent, DashboardCardDivider } from '@proton/atoms/DashboardCard/DashboardCard';
import { DashboardGrid, DashboardGridSectionHeader } from '@proton/atoms/DashboardGrid/DashboardGrid';
import { Href } from '@proton/atoms/Href/Href';
import { IcLocks } from '@proton/icons/icons/IcLocks';
import { IcPassword } from '@proton/icons/icons/IcPassword';
import { useSelector } from '@proton/redux-shared-store/sharedProvider';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { SETTINGS_PASSWORD_MODE } from '@proton/shared/lib/interfaces';
import { getIsGlobalSSOAccount } from '@proton/shared/lib/keys';

import Info from '../../components/link/Info';
import Loader from '../../components/loader/Loader';
import useModalState from '../../components/modalTwo/useModalState';
import useSearchParamsEffect from '../../hooks/useSearchParamsEffect';
import ChangeBackupPasswordModal from './ChangeBackupPasswordModal';
import ChangePasswordModal, { MODES } from './ChangePasswordModal';
import ReauthUsingRecoveryModal from './ReauthUsingRecoveryModal';
import { SettingsIconRow } from './SettingsIconRow';
import { SettingsToggleRow } from './SettingsToggleRow';
import { SettingsValueRow } from './SettingsValueRow';
import VerifyPasswordButton from './VerifyPasswordButton';
import PasswordRemindersSettings from './passwordReminders/PasswordRemindersSettings';
import InitiateSessionRecoveryModal from './sessionRecovery/InitiateSessionRecoveryModal';
import PasswordResetAvailableAccountModal from './sessionRecovery/PasswordResetAvailableAccountModal';

const PasswordsSection = () => {
    const [user, loadingUser] = useUser();
    const [userSettings, loadingUserSettings] = useUserSettings();
    const [organization, loadingOrganization] = useOrganization();
    const { availableRecoveryMethods, hasRecoveryMethod } = useSelector(selectAvailableRecoveryMethods);
    const { isSessionRecoveryInitiationAvailable } = useSelector(selectSessionRecoveryData);

    const [tmpPasswordMode, setTmpPasswordMode] = useState<MODES>();
    const [changePasswordModal, setChangePasswordModalOpen, renderChangePasswordModal] = useModalState();
    const [changeBackupPasswordModal, setChangeBackupPasswordModalOpen, renderChangeBackupPasswordModal] =
        useModalState();
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

    const { dismissCanceledState } = useSessionRecoveryLocalStorage();
    const [skipInfoStep, setSkipInfoStep] = useState(false);
    const [recoveryModalFromAction, setRecoveryModalFromAction] = useState(false);

    const isOnePasswordMode = userSettings?.Password?.Mode === SETTINGS_PASSWORD_MODE.ONE_PASSWORD_MODE;
    const passwordLabel = isOnePasswordMode ? c('Title').t`Password` : c('Title').t`Main password`;
    const passwordButtonLabel = isOnePasswordMode ? c('Title').t`Change password` : c('Title').t`Change login password`;
    const changePasswordMode = isOnePasswordMode
        ? MODES.CHANGE_ONE_PASSWORD_MODE
        : MODES.CHANGE_TWO_PASSWORD_LOGIN_MODE;
    const loading = loadingUserSettings || loadingUser || loadingOrganization;
    const backupPasswordDisabled = !!organization?.Settings.SSOBackupPasswordDisabled;

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
            } else if (action === 'forgot-password') {
                setRecoveryModalFromAction(true);

                if (hasRecoveryMethod) {
                    setRecoveryModalOpen(true);
                } else if (isSessionRecoveryInitiationAvailable) {
                    setSessionRecoveryModalOpen(true);
                }
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
                        dismissCanceledState();
                    }}
                    {...changePasswordModal}
                />
            )}
            {renderChangeBackupPasswordModal && <ChangeBackupPasswordModal {...changeBackupPasswordModal} />}
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
                    onBack={
                        recoveryModalFromAction
                            ? undefined
                            : () => {
                                  recoveryModal.onClose();
                                  // On back, this should open the change password modal in the expected mode
                                  handleChangePassword(changePasswordMode);
                              }
                    }
                    onInitiateSessionRecoveryClick={() => {
                        recoveryModal.onClose();
                        setSessionRecoveryModalOpen(true);
                    }}
                    onSuccess={() => setChangePasswordAfterReauthModalOpen(true)}
                    {...recoveryModal}
                    onClose={() => {
                        setRecoveryModalFromAction(false);
                        recoveryModal.onClose();
                    }}
                />
            )}
            {renderChangePasswordAfterReauthModal && (
                <ChangePasswordModal
                    mode={
                        // If the user has the two password option mode available (has user keys)
                        // we force the user to change password in one password mode.
                        hasTwoPasswordOption
                            ? MODES.CHANGE_ONE_PASSWORD_MODE
                            : // Otherwise, if the user does not have two password mode available,
                              // we change it in the expected mode (login password)
                              changePasswordMode
                    }
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
            {(() => {
                const sectionHeader = (
                    <DashboardGridSectionHeader
                        title={c('Title').t`Password`}
                        subtitle={c('Info')
                            .t`Choose a strong ${BRAND_NAME} password and don’t reuse it for other accounts.`}
                    />
                );

                if (getIsGlobalSSOAccount(user)) {
                    // When the organization disabled the backup password there is nothing to
                    // change: the key passphrase is random and the login flow never asks for it.
                    if (backupPasswordDisabled) {
                        return null;
                    }
                    return (
                        <DashboardGrid>
                            {sectionHeader}
                            <DashboardCard>
                                <DashboardCardContent>
                                    <SettingsIconRow icon={IcPassword}>
                                        <SettingsValueRow
                                            label={
                                                <SettingsValueRow.Label>
                                                    {c('sso').t`Backup password`}
                                                </SettingsValueRow.Label>
                                            }
                                            action={
                                                <SettingsValueRow.EditButton
                                                    id="passwordChange"
                                                    title={c('sso').t`Change backup password`}
                                                    aria-label={c('sso').t`Change backup password`}
                                                    onClick={() => setChangeBackupPasswordModalOpen(true)}
                                                />
                                            }
                                        />
                                    </SettingsIconRow>
                                </DashboardCardContent>
                            </DashboardCard>
                        </DashboardGrid>
                    );
                }

                return (
                    <DashboardGrid>
                        {sectionHeader}
                        <DashboardCard>
                            <DashboardCardContent>
                                <SettingsIconRow icon={IcPassword}>
                                    <SettingsValueRow
                                        label={
                                            <>
                                                <SettingsValueRow.Label>{passwordLabel}</SettingsValueRow.Label>
                                                <VerifyPasswordButton />
                                            </>
                                        }
                                        action={
                                            <SettingsValueRow.EditButton
                                                id="passwordChange"
                                                data-testid="change-password-button"
                                                title={passwordButtonLabel}
                                                aria-label={passwordButtonLabel}
                                                onClick={() => handleChangePassword(changePasswordMode)}
                                            />
                                        }
                                    />
                                </SettingsIconRow>
                                {hasTwoPasswordOption && (
                                    <>
                                        <DashboardCardDivider />
                                        <SettingsIconRow icon={IcLocks}>
                                            <SettingsToggleRow
                                                id="passwordModeToggle"
                                                label={
                                                    <>
                                                        <SettingsToggleRow.Label>
                                                            {c('Label').t`Two-password mode`}
                                                        </SettingsToggleRow.Label>
                                                        <SettingsToggleRow.Description>
                                                            {c('Info')
                                                                .t`Two-password mode requires two passwords: one to sign in to your account and one to decrypt your data. (Advanced)`}{' '}
                                                            <Href
                                                                key="two-password-learn"
                                                                href={getKnowledgeBaseUrl('/switch-two-password-mode')}
                                                            >
                                                                {c('Link').t`Learn more`}
                                                            </Href>
                                                        </SettingsToggleRow.Description>
                                                    </>
                                                }
                                                toggle={
                                                    <SettingsToggleRow.Toggle
                                                        loading={loadingUserSettings}
                                                        checked={!isOnePasswordMode}
                                                        data-testid="change-password-toggle"
                                                        onChange={() =>
                                                            handleChangePassword(
                                                                isOnePasswordMode
                                                                    ? MODES.SWITCH_TWO_PASSWORD
                                                                    : MODES.SWITCH_ONE_PASSWORD
                                                            )
                                                        }
                                                    />
                                                }
                                            />
                                        </SettingsIconRow>
                                        {!isOnePasswordMode && (
                                            <>
                                                <DashboardCardDivider />
                                                <SettingsIconRow icon={IcPassword}>
                                                    <SettingsValueRow
                                                        label={
                                                            <SettingsValueRow.Label>
                                                                {c('Label').t`Second password`}
                                                                <Info url={getKnowledgeBaseUrl('/single-password')} />
                                                            </SettingsValueRow.Label>
                                                        }
                                                        action={
                                                            <SettingsValueRow.EditButton
                                                                id="changeSecondPassword"
                                                                data-testid="change-second-password-button"
                                                                title={c('Action').t`Change second password`}
                                                                aria-label={c('Action').t`Change second password`}
                                                                onClick={() =>
                                                                    handleChangePassword(
                                                                        MODES.CHANGE_TWO_PASSWORD_MAILBOX_MODE
                                                                    )
                                                                }
                                                            />
                                                        }
                                                    />
                                                </SettingsIconRow>
                                            </>
                                        )}
                                    </>
                                )}
                            </DashboardCardContent>
                        </DashboardCard>
                        <PasswordRemindersSettings />
                    </DashboardGrid>
                );
            })()}
        </>
    );
};

export default PasswordsSection;
