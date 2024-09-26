import type { UploadMissingSKL } from '@proton/shared/lib/interfaces';
import { getSignedKeyList } from '@proton/shared/lib/keys';
import { getActiveKeys, getNormalizedActiveKeys } from '@proton/shared/lib/keys/getActiveKeys';

import { fetchProof, updateSignedKeyList } from '../../helpers/apiHelpers';
import { throwKTError } from '../../helpers/utils';
import { saveSKLToLS } from '../../storage';
import { verifyProofOfAbsenceForAllRevision } from '../verifyProofs';

export const uploadMissingSKL: UploadMissingSKL = async ({ userContext, address, epoch, api }) => {
    const proof = await fetchProof(epoch.EpochID, address.Email, 1, api);
    await verifyProofOfAbsenceForAllRevision(proof, address.Email, epoch.TreeHash);
    const decryptedKeys = await userContext.getAddressKeys(address.ID);
    const activeKeys = getNormalizedActiveKeys(
        address,
        await getActiveKeys(address, null, address.Keys, decryptedKeys)
    );
    const skl = await getSignedKeyList(activeKeys, address, async () => {});
    const { Revision, ExpectedMinEpochID } = await updateSignedKeyList(api, address.ID, skl);
    if (!ExpectedMinEpochID) {
        return throwKTError('Returned SKL has no ExpectedMinEpochID', { addressID: address.ID });
    }
    await saveSKLToLS({
        userContext,
        email: address.Email,
        data: skl.Data,
        revision: Revision,
        expectedMinEpochID: ExpectedMinEpochID,
        addressID: address.ID,
        isCatchall: false,
    });
};
