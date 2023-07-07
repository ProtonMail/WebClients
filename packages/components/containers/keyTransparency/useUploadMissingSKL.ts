import {
    Epoch,
    fetchProof,
    throwKTError,
    updateSignedKeyList,
    verifyProofOfAbsenceForAllRevision,
} from '@proton/key-transparency/lib';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { Address, SaveSKLToLS, UploadMissingSKL } from '@proton/shared/lib/interfaces';
import { getSignedKeyList } from '@proton/shared/lib/keys';
import { getActiveKeys, getNormalizedActiveKeys } from '@proton/shared/lib/keys/getActiveKeys';

import { useApi, useGetAddressKeys } from '../../hooks';

const useUploadMissingSKL = (): UploadMissingSKL => {
    const api = getSilentApi(useApi());
    const getAddressKeys = useGetAddressKeys();
    const uploadMissingSKL: UploadMissingSKL = async (address: Address, epoch: Epoch, saveSKLToLS: SaveSKLToLS) => {
        const proof = await fetchProof(epoch.EpochID, address.Email, 1, api);
        verifyProofOfAbsenceForAllRevision(proof, address.Email, epoch.TreeHash);
        const decryptedKeys = await getAddressKeys(address.ID);
        const activeKeys = getNormalizedActiveKeys(
            address,
            await getActiveKeys(address, null, address.Keys, decryptedKeys)
        );
        const skl = await getSignedKeyList(activeKeys, address, async () => {});
        const { Revision, ExpectedMinEpochID } = await updateSignedKeyList(api, address.ID, skl);
        if (!ExpectedMinEpochID) {
            return throwKTError('Returned SKL has no ExpectedMinEpochID', { addressID: address.ID });
        }
        saveSKLToLS(address.Email, skl.Data, Revision, ExpectedMinEpochID, address.ID, false);
    };
    return uploadMissingSKL;
};

export default useUploadMissingSKL;
