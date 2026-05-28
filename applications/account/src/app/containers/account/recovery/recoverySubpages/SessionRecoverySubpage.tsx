import { c } from 'ttag';

import { useIsSentinelUser } from '@proton/account/recovery/sentinelHooks';
import {
    selectAvailableRecoveryMethods,
    selectSessionRecoveryData,
} from '@proton/account/recovery/sessionRecoverySelectors';
import { toggleSignedInReset } from '@proton/account/recovery/userSettingsActions';
import { Button } from '@proton/atoms/Button/Button';
import { DashboardCard, DashboardCardContent, DashboardCardDivider } from '@proton/atoms/DashboardCard/DashboardCard';
import { DashboardGrid } from '@proton/atoms/DashboardGrid/DashboardGrid';
import { Href } from '@proton/atoms/Href/Href';
import Loader from '@proton/components/components/loader/Loader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import ChangePasswordModal, { MODES } from '@proton/components/containers/account/ChangePasswordModal';
import ReauthUsingRecoveryModal from '@proton/components/containers/account/ReauthUsingRecoveryModal';
import SettingsDescription, {
    SettingsDescriptionItem,
} from '@proton/components/containers/account/SettingsDescription';
import { SettingsToggleRow } from '@proton/components/containers/account/SettingsToggleRow';
import InitiateSessionRecoveryModal from '@proton/components/containers/account/sessionRecovery/InitiateSessionRecoveryModal';
import ConfirmDisableSessionRecoveryModal from '@proton/components/containers/recovery/ConfirmDisableSessionRecoveryModal';
import { useRecoverySettingsTelemetry } from '@proton/components/containers/recovery/recoverySettingsTelemetry';
import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import useNotifications from '@proton/components/hooks/useNotifications';
import useLoading from '@proton/hooks/useLoading';
import { IcHourglass } from '@proton/icons/icons/IcHourglass';
import { IcShieldExclamationFilled } from '@proton/icons/icons/IcShieldExclamationFilled';
import metrics, { observeApiError } from '@proton/metrics';
import { useDispatch, useSelector } from '@proton/redux-shared-store/sharedProvider';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import darkIllustration from './assets/session-recovery-dark.svg';
import illustration from './assets/session-recovery.svg';
import RecoveryWarning from './shared/RecoveryWarning';

export const SessionRecoverySubpage = () => {
    const theme = useTheme();
    const isDarkTheme = theme.information.dark;
    const [{ isSentinelUser }, loadingIsSentinelUser] = useIsSentinelUser();
    const { sendRecoverySettingEnabled } = useRecoverySettingsTelemetry();
    const dispatch = useDispatch();

    const [loadingSessionRecovery, withLoadingSessionRecovery] = useLoading();

    const [sessionRecoveryModal, setSessionRecoveryModalOpen, renderSessionRecoveryModal] = useModalState();
    const [recoveryModal, setRecoveryModalOpen, renderRecoveryModal] = useModalState();
    const [changePasswordModal, setChangePasswordModalOpen, renderChangePasswordModal] = useModalState();
    const [
        confirmDisableSessionRecoveryModal,
        setConfirmDisableSessionRecoveryModalOpen,
        renderConfirmDisableSessionRecoveryModal,
    ] = useModalState();

    const {
        availableRecoveryMethods,
        hasRecoveryMethod,
        loading: loadingUseHasRecoveryMethod,
    } = useSelector(selectAvailableRecoveryMethods);
    const {
        isSessionRecoveryEnabled,
        isSessionRecoveryInitiationAvailable,
        loading: loadingSessionRecoveryData,
    } = useSelector(selectSessionRecoveryData);

    const { createNotification } = useNotifications();

    const handleEnableSessionRecoveryToggle = async () => {
        try {
            await dispatch(toggleSignedInReset({ value: true }));
            sendRecoverySettingEnabled({ setting: 'session_recovery' });
            metrics.core_session_recovery_settings_update_total.increment({
                status: 'success',
            });
        } catch (error) {
            observeApiError(error, (status) =>
                metrics.core_session_recovery_settings_update_total.increment({
                    status,
                })
            );
        }
    };

    if (loadingIsSentinelUser || loadingSessionRecoveryData) {
        return <Loader />;
    }

    return (
        <>
            {renderSessionRecoveryModal && (
                <InitiateSessionRecoveryModal
                    onUseRecoveryMethodClick={() => {
                        sessionRecoveryModal.onClose();
                        setRecoveryModalOpen(true);
                    }}
                    confirmedStep
                    {...sessionRecoveryModal}
                />
            )}
            {renderRecoveryModal && (
                <ReauthUsingRecoveryModal
                    availableRecoveryMethods={availableRecoveryMethods}
                    onBack={() => {
                        recoveryModal.onClose();
                        setSessionRecoveryModalOpen(true);
                    }}
                    onInitiateSessionRecoveryClick={() => {
                        recoveryModal.onClose();
                        setSessionRecoveryModalOpen(true);
                    }}
                    onSuccess={() => setChangePasswordModalOpen(true)}
                    {...recoveryModal}
                />
            )}
            {renderChangePasswordModal && (
                <ChangePasswordModal
                    mode={MODES.CHANGE_ONE_PASSWORD_MODE}
                    signedInRecoveryFlow
                    {...changePasswordModal}
                />
            )}
            {renderConfirmDisableSessionRecoveryModal && (
                <ConfirmDisableSessionRecoveryModal {...confirmDisableSessionRecoveryModal} />
            )}
            <DashboardGrid>
                <SettingsDescription
                    left={
                        <>
                            <SettingsDescriptionItem>
                                {c('Info')
                                    .t`Allowing the password reset from the settings lets you to change your password if you’ve lost it, but are still signed in to ${BRAND_NAME}.`}
                            </SettingsDescriptionItem>
                            <SettingsDescriptionItem>
                                {c('Info').t`It’s often the easiest way to recover your account if you’re signed in.`}{' '}
                                <Href key="learn" href={getKnowledgeBaseUrl('/signed-in-reset')}>{c('Link')
                                    .t`Learn more`}</Href>
                            </SettingsDescriptionItem>
                        </>
                    }
                    right={
                        <img
                            src={isDarkTheme ? darkIllustration : illustration}
                            alt=""
                            className="shrink-0 hidden md:block"
                            width={80}
                            height={80}
                        />
                    }
                />
                <DashboardCard>
                    <DashboardCardContent>
                        <SettingsToggleRow
                            id="signedInReset"
                            label={
                                <SettingsToggleRow.Label data-testid="account:recovery:signedInReset">
                                    {c('session_recovery:settings:action').t`Allow password reset from settings`}
                                    {isSentinelUser && <IcShieldExclamationFilled className="color-warning shrink-0" />}
                                </SettingsToggleRow.Label>
                            }
                            toggle={
                                <SettingsToggleRow.Toggle
                                    loading={loadingSessionRecovery}
                                    checked={isSessionRecoveryEnabled}
                                    disabled={loadingUseHasRecoveryMethod}
                                    onChange={({ target: { checked } }) => {
                                        if (!hasRecoveryMethod && !checked) {
                                            createNotification({
                                                text: isSentinelUser
                                                    ? c('session_recovery:settings:info')
                                                          .t`To disallow password reset from settings, you must save your recovery phrase.`
                                                    : c('session_recovery:settings:info')
                                                          .t`To disallow password reset, you must have a recovery method set up.`,
                                            });
                                            return;
                                        }

                                        if (!checked) {
                                            setConfirmDisableSessionRecoveryModalOpen(true);
                                            return;
                                        }

                                        void withLoadingSessionRecovery(handleEnableSessionRecoveryToggle());
                                    }}
                                />
                            }
                        />
                        {isSessionRecoveryInitiationAvailable && (
                            <div className="fade-in">
                                <DashboardCardDivider />
                                <Button
                                    color="norm"
                                    className="inline-flex items-center gap-2"
                                    onClick={() => setSessionRecoveryModalOpen(true)}
                                >
                                    <IcHourglass className="shrink-0" />
                                    {c('session_recovery:settings:action').t`Request password reset`}
                                </Button>
                            </div>
                        )}
                        {!isSessionRecoveryEnabled && !isSentinelUser && <RecoveryWarning />}
                    </DashboardCardContent>
                </DashboardCard>
            </DashboardGrid>
        </>
    );
};
