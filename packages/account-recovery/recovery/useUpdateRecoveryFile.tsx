import { updateDeviceRecoverySettingsThunk } from '@proton/account/recovery/deviceRecovery';
import type { selectRecoveryFileData } from '@proton/account/recovery/recoveryFile';
import { useDispatch } from '@proton/account/store/hooks';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import VoidRecoveryFilesModal from '@proton/components/containers/recovery/VoidRecoveryFilesModal';
import { useRecoverySettingsTelemetry } from '@proton/components/containers/recovery/recoverySettingsTelemetry';

interface UseUpdateRecoveryFileOptions {
    sendSettingEnabledTelemetry?: boolean;
}

export const useUpdateRecoveryFile = (
    recoveryFileData: ReturnType<typeof selectRecoveryFileData>,
    { sendSettingEnabledTelemetry = true }: UseUpdateRecoveryFileOptions = {}
) => {
    const { sendRecoverySettingEnabled } = useRecoverySettingsTelemetry();
    const dispatch = useDispatch();
    const [voidRecoveryFilesModal, setVoidRecoveryFilesModalOpen, renderVoidRecoveryFilesModal] = useModalState();

    const handleChangeDeviceRecoveryToggle = async (checked: boolean) => {
        if (await dispatch(updateDeviceRecoverySettingsThunk({ deviceRecovery: checked }))) {
            if (checked && sendSettingEnabledTelemetry) {
                sendRecoverySettingEnabled({ setting: 'device_recovery' });
            }
        }
    };

    return {
        el: (
            <>
                {renderVoidRecoveryFilesModal && (
                    <VoidRecoveryFilesModal
                        onVoid={() => handleChangeDeviceRecoveryToggle(false)}
                        deviceRecoveryEnabled={recoveryFileData.hasDeviceRecoveryEnabled}
                        {...voidRecoveryFilesModal}
                    />
                )}
            </>
        ),
        voidFiles: () => {
            setVoidRecoveryFilesModalOpen(true);
        },
        toggleDeviceRecovery: (value: boolean) => {
            return handleChangeDeviceRecoveryToggle(value);
        },
    };
};
