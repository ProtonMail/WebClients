import { c } from 'ttag';

import { userSettingsThunk } from '@proton/account/userSettings';
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
import useApi from '@proton/components/hooks/useApi';
import useIsSentinelUser from '@proton/components/hooks/useIsSentinelUser';
import useNotifications from '@proton/components/hooks/useNotifications';
import {
    useAvailableRecoveryMethods,
    useIsSessionRecoveryEnabled,
    useIsSessionRecoveryInitiationAvailable,
} from '@proton/components/hooks/useSessionRecovery';
import useLoading from '@proton/hooks/useLoading';
import { IcHourglass } from '@proton/icons/icons/IcHourglass';
import { IcShieldExclamationFilled } from '@proton/icons/icons/IcShieldExclamationFilled';
import metrics, { observeApiError } from '@proton/metrics';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { CacheType } from '@proton/redux-utilities';
import { updateSessionAccountRecovery } from '@proton/shared/lib/api/sessionRecovery';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import illustration from './assets/session-recovery.svg';
import RecoveryWarning from './shared/RecoveryWarning';
import SentinelWarning from './shared/SentinelWarning';

export const SessionRecoverySubpage = () => {
    const [{ isSentinelUser }, loadingIsSentinelUser] = useIsSentinelUser();
    const { sendRecoverySettingEnabled } = useRecoverySettingsTelemetry();
    const api = useApi();
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

    const [availableRecoveryMethods, loadingUseHasRecoveryMethod] = useAvailableRecoveryMethods();
    const hasRecoveryMethod = availableRecoveryMethods.length > 0;
    const isSessionRecoveryEnabled = useIsSessionRecoveryEnabled();
    const isSessionRecoveryInitiationAvailable = useIsSessionRecoveryInitiationAvailable();

    const { createNotification } = useNotifications();

    const handleEnableSessionRecoveryToggle = async () => {
        try {
            await api(updateSessionAccountRecovery({ SessionAccountRecovery: 1 }));
            await dispatch(userSettingsThunk({ cache: CacheType.None }));
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

    const learnMoreLink = (
        <Href key="learn" href={getKnowledgeBaseUrl('/signed-in-reset')}>
            {c('Link').t`Learn more`}
        </Href>
    );

    if (loadingIsSentinelUser) {
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
                                {learnMoreLink}
                            </SettingsDescriptionItem>
                        </>
                    }
                    right={
                        <img src={illustration} alt="" className="shrink-0 hidden md:block" width={80} height={80} />
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
                        {isSessionRecoveryEnabled && isSentinelUser && (
                            <SentinelWarning
                                text={c('Info')
                                    .t`To ensure the highest possible security of your account, disable **Signed-in reset**.`}
                            />
                        )}
                    </DashboardCardContent>
                </DashboardCard>
            </DashboardGrid>
        </>
    );
};
