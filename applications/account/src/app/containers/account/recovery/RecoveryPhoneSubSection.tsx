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
import RecoveryPhone from '@proton/components/containers/recovery/phone/RecoveryPhone';
import { useRecoverySettingsTelemetry } from '@proton/components/containers/recovery/recoverySettingsTelemetry';
import useMyCountry from '@proton/components/hooks/useMyCountry';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { CacheType } from '@proton/redux-utilities';
import { updateResetPhone } from '@proton/shared/lib/api/settings';
import noop from '@proton/utils/noop';

const RecoveryPhoneSubSection = () => {
    const { sendRecoverySettingEnabled } = useRecoverySettingsTelemetry();
    const [userSettings, loadingUserSettings] = useUserSettings();
    const dispatch = useDispatch();
    const [loadingPhoneReset, withLoadingPhoneReset] = useLoading();
    const { createNotification } = useNotifications();
    const defaultCountry = useMyCountry();
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

    const handleChangePasswordPhoneToggle = async (value: number) => {
        if (value && !userSettings.Phone.Value) {
            return createNotification({
                type: 'error',
                text: c('Error').t`Please set a recovery phone number first`,
            });
        }
        await showAuthModal({ config: updateResetPhone({ Reset: value }) });
        await dispatch(userSettingsThunk({ cache: CacheType.None }));
        if (value) {
            sendRecoverySettingEnabled({ setting: 'recovery_by_phone' });
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
                        <label className="pt-0 mb-2 md:mb-0 text-semibold" htmlFor="phoneInput">
                            {c('label').t`Recovery phone number`}
                        </label>
                    </SettingsLayoutLeft>
                    <SettingsLayoutRight className="flex-1">
                        <RecoveryPhone
                            className="mb-4 md:mb-0"
                            defaultCountry={defaultCountry}
                            phone={userSettings.Phone}
                            hasReset={!!userSettings.Phone.Reset}
                            canSubmit={(value) => {
                                if (!value && !canDisableRecovery.canDisablePhone) {
                                    showRecoveryContactWarning(true);
                                    return false;
                                }
                                return true;
                            }}
                            onSuccess={(updatedUserSettings) => {
                                if (!!updatedUserSettings.Phone.Reset && !!updatedUserSettings.Phone.Value) {
                                    sendRecoverySettingEnabled({ setting: 'recovery_by_phone' });
                                }
                            }}
                        />
                        <div className="flex items-center">
                            <Toggle
                                className="mr-2"
                                loading={loadingPhoneReset}
                                checked={!!userSettings.Phone.Reset && !!userSettings.Phone.Value}
                                id="passwordPhoneResetToggle"
                                onChange={({ target: { checked } }) => {
                                    if (!checked && !canDisableRecovery.canDisablePhone) {
                                        showRecoveryContactWarning(true);
                                        return;
                                    }
                                    return withLoadingPhoneReset(handleChangePasswordPhoneToggle(+checked).catch(noop));
                                }}
                            />
                            <label htmlFor="passwordPhoneResetToggle" className="flex-1">
                                {c('Label').t`Allow recovery by phone`}
                            </label>
                        </div>
                    </SettingsLayoutRight>
                </SettingsLayout>
            </SettingsSection>
        </>
    );
};

export default RecoveryPhoneSubSection;
