import { queryCreatePhotosShare } from '@proton/shared/lib/api/drive/share';
import { CreatedDriveVolumeResult } from '@proton/shared/lib/interfaces/drive/volume';
import { generateDriveBootstrap, generateNodeHashKey } from '@proton/shared/lib/keys/driveKeys';

import { useDebouncedRequest } from '../_api';
import useDefaultShare from './useDefaultShare';
import useShare from './useShare';

// Only used for debug purposed, see DriveSidebar.tsx
export function useCreatePhotos() {
    const debouncedRequest = useDebouncedRequest();
    const { getShareCreatorKeys } = useShare();
    const { getDefaultShare } = useDefaultShare();

    const createPhotosShare = async () => {
        const abortController = new AbortController();
        const defaultShare = await getDefaultShare();
        const { address, privateKey } = await getShareCreatorKeys(abortController.signal, defaultShare.shareId);
        const { bootstrap, folderPrivateKey } = await generateDriveBootstrap(privateKey);
        const { NodeHashKey: FolderHashKey } = await generateNodeHashKey(folderPrivateKey, folderPrivateKey);

        const { Volume } = await debouncedRequest<CreatedDriveVolumeResult>(
            queryCreatePhotosShare(defaultShare.volumeId, {
                Share: {
                    Name: 'Photos',
                    AddressID: address.ID,
                    Key: bootstrap.ShareKey,
                    Passphrase: bootstrap.SharePassphrase,
                    PassphraseSignature: bootstrap.SharePassphraseSignature,
                },
                Link: {
                    Name: bootstrap.FolderName,
                    NodeHashKey: FolderHashKey,
                    NodePassphrase: bootstrap.FolderPassphrase,
                    NodePassphraseSignature: bootstrap.FolderPassphraseSignature,
                    NodeKey: bootstrap.FolderKey,
                },
            })
        );
        return {
            volumeId: Volume.ID,
            shareId: Volume.Share.ID,
            linkId: Volume.Share.LinkID,
        };
    };

    return {
        createPhotosShare,
    };
}
