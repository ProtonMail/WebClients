import { queryCreateDriveVolume, queryUserVolumes } from '@proton/shared/lib/api/drive/volume';
import type { CreatedDriveVolumeResult, UserDriveVolumesResult } from '@proton/shared/lib/interfaces/drive/volume';
import { generateDriveBootstrap, generateNodeHashKey } from '@proton/shared/lib/keys/driveKeys';

import { useDebouncedRequest } from '../_api';
import { useDriveCrypto } from '../_crypto';

export default function useVolume() {
    const debouncedRequest = useDebouncedRequest();
    const { getPrimaryAddressKey } = useDriveCrypto();

    const listVolumes = async (): Promise<UserDriveVolumesResult> => {
        const { Volumes } = await debouncedRequest<UserDriveVolumesResult & { Code: number }>(queryUserVolumes());
        return { Volumes };
    };

    const createVolume = async (): Promise<{ volumeId: string; shareId: string; linkId: string }> => {
        // Volumes should use primary address key, as we only create
        // a new volume when bootstrapping an empty user.
        //
        // In this scenario, there are no other prefered keys.

        const { address, privateKey, addressKeyID } = await getPrimaryAddressKey();
        const { bootstrap, folderPrivateKey } = await generateDriveBootstrap(privateKey);
        const { NodeHashKey: FolderHashKey } = await generateNodeHashKey(folderPrivateKey, folderPrivateKey);
        const { Volume } = await debouncedRequest<CreatedDriveVolumeResult>(
            queryCreateDriveVolume({
                AddressID: address.ID,
                AddressKeyID: addressKeyID,
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
        listVolumes,
    };
}
