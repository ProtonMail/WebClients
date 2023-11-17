import { c } from 'ttag';

import { Button } from '@proton/atoms';
import useLoading from '@proton/hooks/useLoading';
import metrics, { observeApiError } from '@proton/metrics';
import { updateSessionAccountRecovery } from '@proton/shared/lib/api/sessionRecovery';

import { Toggle, useModalState } from '../../components';
import {
    useApi,
    useEventManager,
    useHasRecoveryMethod,
    useIsSessionRecoveryEnabled,
    useIsSessionRecoveryInitiationAvailable,
    useNotifications,
} from '../../hooks';
import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';
import SettingsParagraph from '../account/SettingsParagraph';
import SettingsSection from '../account/SettingsSection';
import InitiateSessionRecoveryModal from '../account/sessionRecovery/InitiateSessionRecoveryModal';
import ConfirmDisableSessionRecoveryModal from './ConfirmDisableSessionRecoveryModal';

const SessionRecoverySection = () => {
    const api = useApi();
    const { call } = useEventManager();

    const [loadingSessionRecovery, withLoadingSessionRecovery] = useLoading();

    const [sessionRecoveryModal, setSessionRecoveryModalOpen, renderSessionRecoveryModal] = useModalState();
    const [
        confirmDisableSessionRecoveryModal,
        setConfirmDisableSessionRecoveryModalOpen,
        renderConfirmDisableSessionRecoveryModal,
    ] = useModalState();

    const [hasRecoveryMethod, loadingUseHasRecoveryMethod] = useHasRecoveryMethod();
    const isSessionRecoveryEnabled = useIsSessionRecoveryEnabled();
    const isSessionRecoveryInitiationAvailable = useIsSessionRecoveryInitiationAvailable();

    const { createNotification } = useNotifications();

    const handleEnableSessionRecoveryToggle = async () => {
        try {
            await api(updateSessionAccountRecovery({ SessionAccountRecovery: 1 }));
            await call();
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

    return (
        <>
            {renderSessionRecoveryModal && <InitiateSessionRecoveryModal confirmedStep {...sessionRecoveryModal} />}
            {renderConfirmDisableSessionRecoveryModal && (
                <ConfirmDisableSessionRecoveryModal {...confirmDisableSessionRecoveryModal} />
            )}
            <SettingsSection>
                <SettingsParagraph>
                    {c('session_recovery:settings:action')
                        .t`Request a password reset from your Account settings. No recovery method needed.`}
                </SettingsParagraph>

                <SettingsLayout>
                    <SettingsLayoutLeft>
                        <label className="pt-0 mb-2 md:mb-0 text-semibold" htmlFor="signedInReset">
                            <span className="mr-2">{c('session_recovery:settings:action')
                                .t`Allow password reset from settings`}</span>
                        </label>
                    </SettingsLayoutLeft>
                    <SettingsLayoutRight className="flex-item-fluid pt-2">
                        <div className="flex items-center">
                            <Toggle
                                loading={loadingSessionRecovery}
                                checked={isSessionRecoveryEnabled}
                                disabled={loadingUseHasRecoveryMethod}
                                id="signedInReset"
                                onChange={({ target: { checked } }) => {
                                    if (!hasRecoveryMethod && !checked) {
                                        createNotification({
                                            text: c('session_recovery:settings:action')
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
                        </div>

                        {isSessionRecoveryInitiationAvailable && (
                            <Button className="mt-4" color="norm" onClick={() => setSessionRecoveryModalOpen(true)}>
                                {c('session_recovery:settings:action').t`Request password reset`}
                            </Button>
                        )}
                    </SettingsLayoutRight>
                </SettingsLayout>
            </SettingsSection>
        </>
    );
};

export default SessionRecoverySection;
