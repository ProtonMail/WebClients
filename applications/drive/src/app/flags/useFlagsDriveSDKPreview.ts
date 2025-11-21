import useFlag from '@proton/unleash/useFlag';

export function useFlagsDriveSDKPreview() {
    const isSDKPreviewEnabled = useFlag('DriveWebSDKPreview');
    return isSDKPreviewEnabled;
}
