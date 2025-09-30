import useFlag from '@proton/unleash/useFlag';

export function useFreeUploadFeature() {
    const freeUploadFeatureEnabled = useFlag('DriveFreeMinutesUpload');
    const freeUploadKillSwitch = useFlag('DriveFreeMinutesUploadDisabled');
    return freeUploadFeatureEnabled && !freeUploadKillSwitch;
}
