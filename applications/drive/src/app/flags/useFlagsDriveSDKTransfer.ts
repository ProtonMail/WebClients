import useFlag from '@proton/unleash/useFlag';

import { getIsPublicContext } from '../utils/getIsPublicContext';

export const useFlagsDriveSDKTransfer = ({ isForPhotos }: { isForPhotos?: boolean | undefined } = {}) => {
    const isSDKTransferEnabled = useFlag('DriveWebSDKTransfer');
    const isPublic = getIsPublicContext();

    return isSDKTransferEnabled && !isPublic && !isForPhotos;
};
