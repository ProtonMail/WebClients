import type { UploadMissingSKL } from '@proton/shared/lib/interfaces';
import { getSignedKeyList } from '@proton/shared/lib/keys';
import { getActiveAddressKeys, getNormalizedActiveAddressKeys } from '@proton/shared/lib/keys/getActiveKeys';

import { fetchProof, updateSignedKeyList } from '../../helpers/apiHelpers';
import { throwKTError } from '../../helpers/utils';
import { saveSKLToLS } from '../../storage/saveSKLToLS';
import { verifyProofOfAbsenceForAllRevision } from '../verifyProofs';

export const uploadMissingSKL: UploadMissingSKL = async ({ ktUserContext, address, addressKeys, epoch, api }) => {
    const proof = await fetchProof(epoch.EpochID, address.Email, 1, api);
    await verifyProofOfAbsenceForAllRevision(proof, address.Email, epoch.TreeHash);
    const activeKeys = getNormalizedActiveAddressKeys(
        address,
        await getActiveAddressKeys(address, null, address.Keys, addressKeys)
    );
    const skl = await getSignedKeyList(activeKeys, address, async () => {});
    const { Revision, ExpectedMinEpochID } = await updateSignedKeyList(api, address.ID, skl);
    if (!ExpectedMinEpochID) {
        return throwKTError('Returned SKL has no ExpectedMinEpochID', { addressID: address.ID });
    }
    await saveSKLToLS({
        ktUserContext,
        email: address.Email,
        data: skl.Data,
        revision: Revision,
        expectedMinEpochID: ExpectedMinEpochID,
        addressID: address.ID,
        isCatchall: false,
    });
};
