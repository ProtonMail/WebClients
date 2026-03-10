import { useFlagsDriveSDKTransfer } from '../../flags/useFlagsDriveSDKTransfer';
import { useTransferManagerState } from '../../sections/transferManager/useTransferManagerState';

// TODO: When DriveSDKTransfer FF is folded-in, use useTransferManagerState directly instead of this hook.
export const useIsTransferManagerVisible = () => {
    const isSDKTransferEnabled = useFlagsDriveSDKTransfer();
    const { isVisible } = useTransferManagerState();

    if (isSDKTransferEnabled) {
        return isVisible;
    }
    // The legacy transfer manager is only used on the public page, which has no gift button,
    // so we can safely treat it as hidden.
    return false;
};
