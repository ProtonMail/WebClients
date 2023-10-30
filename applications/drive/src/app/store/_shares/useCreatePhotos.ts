import { queryCreatePhotosShare } from '@proton/shared/lib/api/drive/share';
import { CreatedDriveVolumeResult } from '@proton/shared/lib/interfaces/drive/volume';
import { generateDriveBootstrap, generateNodeHashKey } from '@proton/shared/lib/keys/driveKeys';

import { useDebouncedRequest } from '../_api';
import { useDriveCrypto } from '../_crypto';
import useDefaultShare from './useDefaultShare';

export function useCreatePhotos() {
    const debouncedRequest = useDebouncedRequest();
    const { getOwnAddressAndPrimaryKeys } = useDriveCrypto();
    const { getDefaultShare } = useDefaultShare();

    const createPhotosShare = async () => {
        const defaultShare = await getDefaultShare();
        const { address, privateKey } = await getOwnAddressAndPrimaryKeys(defaultShare.creator);
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
