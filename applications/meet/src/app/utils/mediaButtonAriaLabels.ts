import { c } from 'ttag';

export const getMicrophoneButtonAriaLabel = ({
    hasPermission,
    noDeviceDetected,
    isEnabled,
}: {
    hasPermission: boolean;
    noDeviceDetected: boolean;
    isEnabled: boolean;
}): string => {
    if (!hasPermission) {
        return c('Info').t`Microphone permission denied`;
    }
    if (noDeviceDetected) {
        return c('Info').t`No microphone detected`;
    }
    return isEnabled ? c('Info').t`Mute microphone` : c('Info').t`Unmute microphone`;
};

export const getCameraButtonAriaLabel = ({
    hasPermission,
    noDeviceDetected,
    isEnabled,
}: {
    hasPermission: boolean;
    noDeviceDetected: boolean;
    isEnabled: boolean;
}): string => {
    if (!hasPermission) {
        return c('Info').t`Camera permission denied`;
    }
    if (noDeviceDetected) {
        return c('Info').t`No camera detected`;
    }
    return isEnabled ? c('Info').t`Turn off camera` : c('Info').t`Turn on camera`;
};
