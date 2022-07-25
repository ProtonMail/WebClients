import { queryCreateDriveDevice } from '@proton/shared/lib/api/drive/devices';
import { CreatedDriveVolumeResult } from '@proton/shared/lib/interfaces/drive/volume';
import { generateDriveBootstrap, generateNodeHashKey } from '@proton/shared/lib/keys/driveKeys';

import { useDebouncedRequest } from '../_api';
import { useDriveCrypto } from '../_crypto';
import useDefaultShare from './useDefaultShare';

// TODO: temp
export function useCreateDevice() {
    const debouncedRequest = useDebouncedRequest();
    const { getPrimaryAddressKey } = useDriveCrypto();
    const { getDefaultShare } = useDefaultShare();

    const createDevice = async (): Promise<{ volumeId: string; shareId: string; linkId: string }> => {
        const { address, privateKey } = await getPrimaryAddressKey();
        const { bootstrap, folderPrivateKey } = await generateDriveBootstrap(privateKey);
        const { NodeHashKey: FolderHashKey } = await generateNodeHashKey(folderPrivateKey, folderPrivateKey);
        const { volumeId } = await getDefaultShare();

        const { Volume } = await debouncedRequest<CreatedDriveVolumeResult>(
            queryCreateDriveDevice({
                Device: {
                    VolumeID: volumeId,
                    SyncState: 1,
                    Type: 1,
                },
                Share: {
                    Name: 'My device',
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
        createDevice,
    };
}
