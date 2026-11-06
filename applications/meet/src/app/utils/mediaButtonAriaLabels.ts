import { c } from 'ttag';

export const getMicrophoneButtonAriaLabel = ({
    hasPermission,
    noDeviceDetected,
    isEnabled,
    isLoading = false,
}: {
    hasPermission: boolean;
    noDeviceDetected: boolean;
    isEnabled: boolean;
    isLoading?: boolean;
}): string => {
    if (isLoading) {
        return c('Info').t`Microphone is starting`;
    }
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
    isLoading = false,
}: {
    hasPermission: boolean;
    noDeviceDetected: boolean;
    isEnabled: boolean;
    isLoading?: boolean;
}): string => {
    if (isLoading) {
        return c('Info').t`Camera is starting`;
    }
    if (!hasPermission) {
        return c('Info').t`Camera permission denied`;
    }
    if (noDeviceDetected) {
        return c('Info').t`No camera detected`;
    }
    return isEnabled ? c('Info').t`Turn off camera` : c('Info').t`Turn on camera`;
};
