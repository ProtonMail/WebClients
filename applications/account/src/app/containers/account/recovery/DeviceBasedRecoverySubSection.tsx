import { c } from 'ttag';

import { userThunk } from '@proton/account/user';
import { userSettingsThunk } from '@proton/account/userSettings';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import Info from '@proton/components/components/link/Info';
import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import SettingsSection from '@proton/components/containers/account/SettingsSection';
import { useRecoverySettingsTelemetry } from '@proton/components/containers/recovery/recoverySettingsTelemetry';
import useIsRecoveryFileAvailable from '@proton/components/hooks/recoveryFile/useIsRecoveryFileAvailable';
import useApi from '@proton/components/hooks/useApi';
import { useSyncDeviceRecovery } from '@proton/components/hooks/useSyncDeviceRecovery';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { CacheType } from '@proton/redux-utilities';
import { updateDeviceRecovery } from '@proton/shared/lib/api/settingsRecovery';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

const DeviceBasedRecoverySubSection = () => {
    const { sendRecoverySettingEnabled } = useRecoverySettingsTelemetry();
    const [userSettings] = useUserSettings();
    const dispatch = useDispatch();
    const api = useApi();

    const syncDeviceRecoveryHelper = useSyncDeviceRecovery();
    const [isRecoveryFileAvailable] = useIsRecoveryFileAvailable();

    const [loadingDeviceRecovery, withLoadingDeviceRecovery] = useLoading();

    const handleChangeDeviceRecoveryToggle = async (checked: boolean) => {
        const DeviceRecovery = Number(checked) as 0 | 1;
        if (userSettings.DeviceRecovery === DeviceRecovery) {
            return;
        }
        await api(updateDeviceRecovery({ DeviceRecovery }));
        await syncDeviceRecoveryHelper({ DeviceRecovery });
        await Promise.all([
            dispatch(userThunk({ cache: CacheType.None })),
            dispatch(userSettingsThunk({ cache: CacheType.None })),
        ]);
        if (checked) {
            sendRecoverySettingEnabled({ setting: 'device_recovery' });
        }
    };

    if (!isRecoveryFileAvailable) {
        return null;
    }

    return (
        <SettingsSection>
            <SettingsLayout>
                <SettingsLayoutLeft>
                    <label className="pt-0 mb-2 md:mb-0 text-semibold" htmlFor="deviceRecoveryToggle">
                        <span className="mr-2">{c('label').t`Device-based recovery`}</span>
                        <Info
                            url={getKnowledgeBaseUrl('/device-data-recovery')}
                            title={c('Info')
                                .t`We securely store recovery information on your trusted device to prevent you from losing your data`}
                        />
                    </label>
                </SettingsLayoutLeft>
                <SettingsLayoutRight isToggleContainer>
                    <div className="flex items-start">
                        <Toggle
                            className="mr-2"
                            loading={loadingDeviceRecovery}
                            checked={!!userSettings.DeviceRecovery}
                            id="deviceRecoveryToggle"
                            onChange={({ target: { checked } }) =>
                                withLoadingDeviceRecovery(handleChangeDeviceRecoveryToggle(checked))
                            }
                        />
                        <label
                            htmlFor="deviceRecoveryToggle"
                            className="flex-1 mt-0.5"
                            data-testid="account:recovery:trustedDevice"
                        >
                            {c('Label').t`Allow recovery using a trusted device`}
                        </label>
                    </div>
                </SettingsLayoutRight>
            </SettingsLayout>
        </SettingsSection>
    );
};

export default DeviceBasedRecoverySubSection;
