import useFlag from '@proton/unleash/useFlag';

import { getIsPublicContext } from '../utils/getIsPublicContext';

export const useFlagsDriveSDKTransfer = ({ isForPhotos }: { isForPhotos?: boolean | undefined } = {}) => {
    const isSDKTransferEnabled = useFlag('DriveWebSDKTransfer');
    const isSDKPhotosTransferEnabled = useFlag('DriveWebSDKPhotosTransfer');
    const isSDKPublicEnabled = useFlag('DriveWebSDKPublic');

    if (getIsPublicContext()) {
        return isSDKTransferEnabled && isSDKPublicEnabled;
    }

    return isSDKTransferEnabled && (isSDKPhotosTransferEnabled || !isForPhotos);
};
