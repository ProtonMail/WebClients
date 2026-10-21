import { useFlagsDriveEasySwitch } from '@proton/drive/modules/flags';
import { useFlag } from '@proton/unleash/useFlag';

export function useFreeUploadFeature() {
    const freeUploadFeatureEnabled = useFlag('DriveFreeMinutesUpload');
    const freeUploadKillSwitch = useFlag('DriveFreeMinutesUploadDisabled');
    const { isEasySwitchEnabled } = useFlagsDriveEasySwitch();
    return freeUploadFeatureEnabled && !freeUploadKillSwitch && !isEasySwitchEnabled;
}
