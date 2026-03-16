import { c } from 'ttag';

import { RecoveryMethodWarningModal } from '@proton/account/delegatedAccess/recoveryContact/RecoveryMethodWarningModal';
import { getCanDisableRecovery } from '@proton/account/delegatedAccess/recoveryContact/getCanDisableRecovery';
import { useOutgoingItems } from '@proton/account/delegatedAccess/shared/outgoing/useOutgoingItems';
import { userSettingsThunk } from '@proton/account/userSettings';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import Loader from '@proton/components/components/loader/Loader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { useModalTwoPromise } from '@proton/components/components/modalTwo/useModalTwo';
import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import SettingsSection from '@proton/components/containers/account/SettingsSection';
import AuthModal from '@proton/components/containers/password/AuthModal';
import type { AuthModalResult } from '@proton/components/containers/password/interface';
import RecoveryEmail from '@proton/components/containers/recovery/email/RecoveryEmail';
import { useRecoverySettingsTelemetry } from '@proton/components/containers/recovery/recoverySettingsTelemetry';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { CacheType } from '@proton/redux-utilities';
import { updateResetEmail } from '@proton/shared/lib/api/settings';
import noop from '@proton/utils/noop';

const RecoveryEmailSubSection = () => {
    const { sendRecoverySettingEnabled } = useRecoverySettingsTelemetry();
    const [userSettings, loadingUserSettings] = useUserSettings();
    const dispatch = useDispatch();
    const [loadingEmailReset, withLoadingEmailReset] = useLoading();
    const { createNotification } = useNotifications();
    const [authModal, showAuthModal] = useModalTwoPromise<{ config: any }, AuthModalResult>();
    const outgoingItems = useOutgoingItems();
    const canDisableRecovery = getCanDisableRecovery({
        recoveryContacts: outgoingItems.items.recoveryContacts,
        userSettings,
    });
    const [renderProps, showRecoveryContactWarning, renderModal] = useModalState();

    if (loadingUserSettings || !userSettings) {
        return <Loader />;
    }

    const handleChangePasswordEmailToggle = async (value: number) => {
        if (value && !userSettings.Email.Value) {
            return createNotification({
                type: 'error',
                text: c('Error').t`Please set a recovery email first`,
            });
        }
        await showAuthModal({ config: updateResetEmail({ Reset: value }) });
        await dispatch(userSettingsThunk({ cache: CacheType.None }));
        if (value) {
            sendRecoverySettingEnabled({ setting: 'recovery_by_email' });
        }
    };

    return (
        <>
            {authModal(({ onResolve, onReject, ...props }) => (
                <AuthModal {...props} scope="password" onCancel={onReject} onSuccess={onResolve} />
            ))}
            {renderModal && <RecoveryMethodWarningModal {...renderProps} />}
            <SettingsSection>
                <SettingsLayout>
                    <SettingsLayoutLeft>
                        <label className="pt-0 mb-2 md:mb-0 text-semibold" htmlFor="recovery-email-input">
                            {c('Label').t`Recovery email address`}
                        </label>
                    </SettingsLayoutLeft>
                    <SettingsLayoutRight className="flex-1">
                        <RecoveryEmail
                            className="mb-4 md:mb-0"
                            email={userSettings.Email}
                            hasReset={!!userSettings.Email.Reset}
                            hasNotify={!!userSettings.Email.Notify}
                            canSubmit={(value) => {
                                if (!value && !canDisableRecovery.canDisableEmail) {
                                    showRecoveryContactWarning(true);
                                    return false;
                                }
                                return true;
                            }}
                            onSuccess={(updatedUserSettings) => {
                                if (!!updatedUserSettings.Email.Reset && !!updatedUserSettings.Email.Value) {
                                    sendRecoverySettingEnabled({ setting: 'recovery_by_email' });
                                }
                            }}
                        />
                        <div className="flex items-center">
                            <Toggle
                                className="mr-2"
                                loading={loadingEmailReset}
                                checked={!!userSettings.Email.Reset && !!userSettings.Email.Value}
                                id="passwordEmailResetToggle"
                                onChange={({ target: { checked } }) => {
                                    if (!checked && !canDisableRecovery.canDisableEmail) {
                                        showRecoveryContactWarning(true);
                                        return;
                                    }
                                    return withLoadingEmailReset(handleChangePasswordEmailToggle(+checked).catch(noop));
                                }}
                            />
                            <label htmlFor="passwordEmailResetToggle" className="flex-1">
                                {c('Label').t`Allow recovery by email`}
                            </label>
                        </div>
                    </SettingsLayoutRight>
                </SettingsLayout>
            </SettingsSection>
        </>
    );
};

export default RecoveryEmailSubSection;
