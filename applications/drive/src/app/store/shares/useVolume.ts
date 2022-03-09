import { CreatedDriveVolumeResult } from '@proton/shared/lib/interfaces/drive/volume';
import { queryCreateDriveVolume } from '@proton/shared/lib/api/drive/volume';
import { generateDriveBootstrap, generateNodeHashKey } from '@proton/shared/lib/keys/driveKeys';

import { useDebouncedRequest } from '../api';
import { useDriveCrypto } from '../crypto';

export default function useVolume() {
    const debouncedRequest = useDebouncedRequest();
    const { getPrimaryAddressKey } = useDriveCrypto();

    const createVolume = async (): Promise<{ volumeId: string; shareId: string; linkId: string }> => {
        const { address, privateKey } = await getPrimaryAddressKey();
        const { bootstrap, folderPrivateKey } = await generateDriveBootstrap(privateKey);
        const { NodeHashKey: FolderHashKey } = await generateNodeHashKey(folderPrivateKey.toPublic(), folderPrivateKey);

        const { Volume } = await debouncedRequest<CreatedDriveVolumeResult>(
            queryCreateDriveVolume({
                AddressID: address.ID,
                VolumeName: 'MainVolume',
                ShareName: 'MainShare',
                FolderHashKey,
                ...bootstrap,
            })
        );
        return {
            volumeId: Volume.ID,
            shareId: Volume.Share.ID,
            linkId: Volume.Share.LinkID,
        };
    };

    return {
        createVolume,
    };
}
