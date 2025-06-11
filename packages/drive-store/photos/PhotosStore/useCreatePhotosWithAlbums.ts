import { queryCreatePhotosWithAlbumsVolume } from '@proton/shared/lib/api/drive/volume';
import type { CreatedDriveVolumeResult } from '@proton/shared/lib/interfaces/drive/volume';
import { generateAlbumsBootstrap, generateNodeHashKey } from '@proton/shared/lib/keys/driveKeys';

import { useDefaultShare } from '../../store';
import { useDebouncedRequest } from '../../store/_api';
import { useShare } from '../../store/_shares';

export function useCreatePhotosWithAlbums() {
    const debouncedRequest = useDebouncedRequest();
    const { getShareCreatorKeys } = useShare();
    const { getDefaultShare } = useDefaultShare();

    const createPhotosWithAlbumsShare = async () => {
        const abortController = new AbortController();
        const defaultShare = await getDefaultShare();
        const { address, privateKey, addressKeyID } = await getShareCreatorKeys(abortController.signal, defaultShare);
        const { bootstrap, albumPrivateKey } = await generateAlbumsBootstrap(privateKey);
        const { NodeHashKey: FolderHashKey } = await generateNodeHashKey(albumPrivateKey, albumPrivateKey);

        const { Volume } = await debouncedRequest<CreatedDriveVolumeResult>(
            queryCreatePhotosWithAlbumsVolume({
                Share: {
                    AddressID: address.ID,
                    AddressKeyID: addressKeyID,
                    Key: bootstrap.ShareKey,
                    Passphrase: bootstrap.SharePassphrase,
                    PassphraseSignature: bootstrap.SharePassphraseSignature,
                },
                Link: {
                    Name: bootstrap.AlbumName,
                    NodeHashKey: FolderHashKey,
                    NodePassphrase: bootstrap.FolderPassphrase,
                    NodePassphraseSignature: bootstrap.FolderPassphraseSignature,
                    NodeKey: bootstrap.AlbumKey,
                },
            })
        );

        return {
            volumeId: Volume.VolumeID,
            shareId: Volume.Share.ID,
            linkId: Volume.Share.LinkID,
            addressId: address.ID,
        };
    };

    return {
        createPhotosWithAlbumsShare,
    };
}
