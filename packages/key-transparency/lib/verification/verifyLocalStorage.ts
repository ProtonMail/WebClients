import { CryptoProxy, PrivateKeyReference, PublicKeyReference } from '@proton/crypto';
import getPublicKeysEmailHelper from '@proton/shared/lib/api/helpers/getPublicKeysEmailHelper';
import { KEY_FLAG } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { Api, KTLocalStorageAPI } from '@proton/shared/lib/interfaces';

import { MAX_EPOCH_INTERVAL } from '../constants';
import { fetchSKLFromEpoch } from '../helpers/fetchHelpers';
import {
    getTimeFromObsolescenceToken,
    isTimestampOlderThanThreshold,
    isTimestampTooOld,
    isTimestampTooOlderThanReference,
    isTimestampWithinDoubleRange,
    isTimestampWithinSingleRange,
    ktSentryReport,
} from '../helpers/utils';
import { KTBlobContent, KeyWithFlags } from '../interfaces';
import { encryptKTtoLS, getAllKTBlobValuesWithInfo, removeKTFromLS } from '../storage/storageHelpers';
import { verifySKLInsideEpochID } from './verifyEpochs';
import { verifySKLSignature } from './verifyKeys';

/**
 * Verify that the SKL(s) stored in one (or more) localStorage blob(s)
 * are correctly committed to KT
 */
const verifyKTBlobsContent = async (
    ktBlobsContent: KTBlobContent[],
    apis: Api[],
    publicKeys: PublicKeyReference[],
    ktLSAPI: KTLocalStorageAPI,
    userID: string,
    addressID: string,
    userPrimaryPrivateKey: PrivateKeyReference
) => {
    const [api, silentApi] = apis;
    const newKTBlobsContent: KTBlobContent[] = [];

    for (const ktBlobContent of ktBlobsContent) {
        const { ExpectedMinEpochID, creationTimestamp, PublicKeys, email, isObsolete } = ktBlobContent;
        const localKeys = await Promise.all(
            PublicKeys.map((armoredKey) => CryptoProxy.importPublicKey({ armoredKey }))
        );

        const targetSKL = await fetchSKLFromEpoch(silentApi, ExpectedMinEpochID, email);
        if (!targetSKL) {
            if (!isTimestampOlderThanThreshold(creationTimestamp)) {
                if (isTimestampTooOld(creationTimestamp)) {
                    ktSentryReport('No target SKL found for a local timestamp older than max epoch interval', {
                        context: 'checkLSBlobs',
                    });
                } else {
                    newKTBlobsContent.push(ktBlobContent);
                }
            }
            continue;
        }

        const { Data, Signature, MinEpochID } = targetSKL;
        let signatureTime: number | undefined;
        if (Data && Signature) {
            const verificationKeys = [...publicKeys, ...localKeys];
            const signatureTimestamp = await verifySKLSignature(verificationKeys, Data, Signature, 'checkLSBlobs');
            if (!signatureTimestamp) {
                // Note that this shouldn't be considered an hard failure since signature verification
                // might fail in case keys drastically changed
                continue;
            }

            signatureTime = +signatureTimestamp;
            if (
                signatureTime &&
                !isTimestampWithinDoubleRange(signatureTime, creationTimestamp, creationTimestamp + MAX_EPOCH_INTERVAL)
            ) {
                ktSentryReport('Active target SKL signature timestamp is not in the expected range', {
                    context: 'checkLSBlobs',
                    signatureTime,
                    creationTimestamp,
                });
                continue;
            }
        }

        if (MinEpochID === null || MinEpochID > ExpectedMinEpochID) {
            ktSentryReport('MinEpochID of target SKL is null or bigger than ExpectedMinEpochID', {
                context: 'checkLSBlobs',
                MinEpochID,
                ExpectedMinEpochID,
            });
            continue;
        }

        const { certificateTimestamp, ObsolescenceToken } = await verifySKLInsideEpochID(
            MinEpochID,
            email,
            targetSKL,
            api
        );
        if (isTimestampTooOlderThanReference(creationTimestamp, certificateTimestamp)) {
            ktSentryReport(
                "Certificate of target SKL's MinEpochID is more recent than the creation timestamp by more than max epoch interval",
                {
                    context: 'checkLSBlobs',
                    certificateTimestamp,
                    creationTimestamp,
                }
            );
            continue;
        }

        if (isObsolete) {
            if (Data && Signature) {
                if (
                    !signatureTime ||
                    !isTimestampWithinDoubleRange(
                        signatureTime,
                        creationTimestamp,
                        creationTimestamp + MAX_EPOCH_INTERVAL
                    )
                ) {
                    // Note that this shouldn't be considered an hard failure since signature verification
                    // might fail in case keys drastically changed, thus signatureTime might be undefined
                    ktSentryReport('Obsolescent blob failed verification after reactivation', {
                        context: 'checkLSBlobs',
                        signatureTime,
                        creationTimestamp,
                    });
                }
            } else if (
                !ObsolescenceToken ||
                !isTimestampWithinSingleRange(getTimeFromObsolescenceToken(ObsolescenceToken), creationTimestamp)
            ) {
                ktSentryReport('Obsolescent blob failed verification while still obsolesent', {
                    context: 'checkLSBlobs',
                    ObsolescenceToken,
                    creationTimestamp,
                });
                continue;
            }
        }
    }

    /*
        TODO: We keep a blob in local storage only if its verification is still pending. If verification succeeded
        we can remove it legitimately. If it failed verification we remove it as well, but only as long as KT UI
        is not around, afterwards we shouldn't discard blobs whose verification fail
    */
    await removeKTFromLS(userID, addressID, ktLSAPI);
    if (newKTBlobsContent.length) {
        await encryptKTtoLS({ userID, addressID, ktBlobsContent: newKTBlobsContent }, userPrimaryPrivateKey, ktLSAPI);
    }
};

/**
 * Check local storage for any previously stored KT blobs
 * that need to be verified
 */
export const checkLSBlobs = async (
    userID: string,
    userPrivateKeys: PrivateKeyReference[],
    ktLSAPI: KTLocalStorageAPI,
    ownAddressKeys: Map<string, KeyWithFlags[]>,
    apis: Api[]
) => {
    const [api] = apis;
    const ktBlobsMap = await getAllKTBlobValuesWithInfo(userID, userPrivateKeys, ktLSAPI);

    for (const { userID, addressID, ktBlobsContent } of ktBlobsMap.values()) {
        const verificationKeys: PublicKeyReference[] = [];

        // If this address is owned by the user, verificationKeys are the address keys
        const ownKeys = ownAddressKeys.get(addressID);
        if (ownKeys) {
            const addressVerificationKeys = ownKeys
                .filter(({ Flags }) => hasBit(Flags, KEY_FLAG.FLAG_NOT_COMPROMISED))
                .map(({ PublicKey }) => PublicKey);
            verificationKeys.push(...addressVerificationKeys);
        } else {
            // Otherwise we fetch the keys of the other user
            const { publicKeys } = await getPublicKeysEmailHelper(
                api,
                ktBlobsContent[0].email,
                async () => {},
                true,
                true
            );
            const addressVerificationKeys = await Promise.all(
                publicKeys
                    .filter(({ flags }) => hasBit(flags, KEY_FLAG.FLAG_NOT_COMPROMISED))
                    .map(({ armoredKey }) => CryptoProxy.importPublicKey({ armoredKey }))
            );
            verificationKeys.push(...addressVerificationKeys);
        }

        await verifyKTBlobsContent(
            ktBlobsContent,
            apis,
            verificationKeys,
            ktLSAPI,
            userID,
            addressID,
            userPrivateKeys[0]
        );
    }
};
