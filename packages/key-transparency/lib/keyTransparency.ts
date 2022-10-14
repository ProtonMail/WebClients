import { OpenPGPKey, decryptMessage, encryptMessage, getMessage, getSignature } from 'pmcrypto';

import { getCanonicalEmailMap } from '@proton/shared/lib/api/helpers/canonicalEmailMap';
import { hasStorage, removeItem, setItem } from '@proton/shared/lib/helpers/storage';
import { Address, Api, KeyPair, SignedKeyList, SignedKeyListEpochs, SimpleMap } from '@proton/shared/lib/interfaces';

import { parseCertChain } from './certTransparency';
import { EXP_EPOCH_INTERVAL, KT_STATUS } from './constants';
import {
    fetchEpoch,
    fetchLastEpoch,
    fetchParsedSKLs,
    fetchProof,
    fetchVerifiedEpoch,
    uploadEpoch,
} from './fetchHelper';
import { Epoch, EpochExtended, KTInfo, KTInfoSelfAudit, KTInfoToLS } from './interfaces';
import {
    checkSignature,
    getFromLS,
    getKTBlobs,
    getSignatureTime,
    isTimestampTooOld,
    parseKeyLists,
    removeFromLS,
    verifyCurrentEpoch,
    verifyEpoch,
    verifyKeyLists,
} from './utils';

/**
 * For that public keys associated to an email address are correctly stored in KT
 */
export const verifyPublicKeys = async (
    keyList: {
        Flags: number;
        PublicKey: string;
    }[],
    email: string,
    signedKeyList: SignedKeyListEpochs | undefined,
    api: Api
): Promise<KTInfo> => {
    if (!signedKeyList) {
        return {
            code: KT_STATUS.KTERROR_ADDRESS_NOT_IN_KT,
            error: 'Signed key list undefined',
        };
    }

    let canonicalEmail: string | undefined;
    try {
        canonicalEmail = (await getCanonicalEmailMap([email], api))[email];
    } catch (error: any) {
        return { code: KT_STATUS.KT_FAILED, error: error.message };
    }
    if (!canonicalEmail) {
        return {
            code: KT_STATUS.KT_FAILED,
            error: `Failed to canonicalize email "${email}"`,
        };
    }
    // Parse key lists
    const { signedKeyListData, parsedKeyList } = await parseKeyLists(keyList, signedKeyList.Data);

    // Check signature
    try {
        await checkSignature(
            signedKeyList.Data,
            parsedKeyList.map((key) => key.PublicKey),
            signedKeyList.Signature,
            'SKL during PK verification'
        );
    } catch (error: any) {
        return { code: KT_STATUS.KT_FAILED, error: error.message };
    }

    // Check key list and signed key list
    try {
        await verifyKeyLists(parsedKeyList, signedKeyListData);
    } catch (error: any) {
        return {
            code: KT_STATUS.KT_FAILED,
            error: `Mismatch found between key list and signed key list. ${error.message}`,
        };
    }

    // If signedKeyList is (allegedly) too young, users is warned and verification cannot continue
    if (!signedKeyList.MaxEpochID || signedKeyList.MaxEpochID === null) {
        return {
            code: KT_STATUS.KTERROR_MINEPOCHID_NULL,
            error: 'The keys were generated too recently to be included in key transparency',
        };
    }

    // Verify latest epoch
    let maxEpoch: Epoch;
    try {
        maxEpoch = await fetchEpoch(signedKeyList.MaxEpochID, api);
    } catch (error: any) {
        let status = KT_STATUS.KT_FAILED;
        if (error.message === 'Leaf node does not exist') {
            status = KT_STATUS.KTERROR_ADDRESS_NOT_IN_KT;
        }
        return { code: status, error: error.message };
    }

    let returnedDate: number;
    try {
        returnedDate = await verifyEpoch(maxEpoch, canonicalEmail, signedKeyList.Data, api);
    } catch (error: any) {
        return { code: KT_STATUS.KT_FAILED, error: error.message };
    }

    if (isTimestampTooOld(returnedDate)) {
        return {
            code: KT_STATUS.KT_FAILED,
            error: 'Returned date is older than MAX_EPOCH_INTERVAL',
        };
    }

    return { code: KT_STATUS.KT_PASSED, error: '' };
};

/**
 * Execute self-audit on the user's own keys
 */
export const ktSelfAudit = async (
    apis: Api[],
    addresses: Address[],
    userKeys: { privateKey?: OpenPGPKey }[] | undefined
): Promise<Map<string, KTInfoSelfAudit>> => {
    // silentApi is used to prevent red banner when a verified epoch is not found
    const [api, silentApi] = apis;

    // Initialise output
    const addressesToVerifiedEpochs: Map<
        string,
        {
            code: number;
            verifiedEpoch?: EpochExtended;
            error: string;
        }
    > = new Map();

    // Canonicalize emails
    let canonicalEmailMap: SimpleMap<string> | undefined;
    try {
        canonicalEmailMap = await getCanonicalEmailMap(
            addresses.map((address) => address.Email),
            api
        );
    } catch (error: any) {
        canonicalEmailMap = undefined;
    }

    // Prepare user private key for localStorage decrypt
    const userKey = userKeys ? userKeys[0].privateKey : undefined;

    // Main loop through addresses
    for (let i = 0; i < addresses.length; i++) {
        // Parse info from address
        const address = addresses[i];
        if (!canonicalEmailMap) {
            addressesToVerifiedEpochs.set(address.ID, {
                code: KT_STATUS.KT_FAILED,
                error: 'Failed to get canonicalized emails',
            });
            continue;
        }
        const email = canonicalEmailMap[address.Email];
        if (!email) {
            addressesToVerifiedEpochs.set(address.ID, {
                code: KT_STATUS.KT_FAILED,
                error: `Failed to canonicalize email ${address.Email}`,
            });
            continue;
        }

        if (!address.SignedKeyList) {
            addressesToVerifiedEpochs.set(address.ID, {
                code: KT_STATUS.KT_FAILED,
                error: `Signed key list not found for ${address.Email}`,
            });
            continue;
        }

        // Parse key lists
        const { signedKeyListData, parsedKeyList } = await parseKeyLists(
            address.Keys.map((key) => ({
                Flags: key.Flags,
                PublicKey: key.PublicKey,
            })),
            address.SignedKeyList.Data
        );

        // Check content of localStorage
        const ktBlobs = getFromLS(address.ID);
        let errorFlag = false;
        for (let i = 0; i < ktBlobs.length; i++) {
            const ktBlob = ktBlobs[i];
            if (ktBlob) {
                // Decrypt and parse ktBlob
                if (!userKey) {
                    addressesToVerifiedEpochs.set(address.ID, {
                        code: KT_STATUS.KT_FAILED,
                        error: `Missing primary user key`,
                    });
                    errorFlag = true;
                    break;
                }
                let decryptedBlob;
                try {
                    decryptedBlob = JSON.parse(
                        (
                            await decryptMessage({
                                message: await getMessage(ktBlob),
                                privateKeys: userKey,
                            })
                        ).data
                    );
                } catch (error: any) {
                    addressesToVerifiedEpochs.set(address.ID, {
                        code: KT_STATUS.KT_FAILED,
                        error: `Decrytption of ktBlob in localStorage failed with error "${error.message}"`,
                    });
                    errorFlag = true;
                    break;
                }
                const { SignedKeyList: localSKL, EpochID: localEpochID } = decryptedBlob;
                const localSignature = await getSignature(localSKL.Signature);

                // Retrieve oldest SKL since localEpochID
                const fetchedSKLs = await fetchParsedSKLs(api, localEpochID, email, false);
                const includedSKLarray: SignedKeyListEpochs[] = await Promise.all(
                    fetchedSKLs.filter(async (skl) => {
                        const sklSignature = await getSignature(skl.Signature);
                        return (
                            (!skl.MinEpochID || skl.MinEpochID === null || skl.MinEpochID > localEpochID) &&
                            getSignatureTime(sklSignature) >= getSignatureTime(localSignature)
                        );
                    })
                );

                // If we are checking the first blob, then included SKL should be the oldest, otherwise it
                // should be the one immediately after.
                const includedSKL = includedSKLarray[i];
                if (!includedSKL) {
                    addressesToVerifiedEpochs.set(address.ID, {
                        code: KT_STATUS.KT_FAILED,
                        error: 'Included signed key list not found',
                    });
                    errorFlag = true;
                    break;
                }
                const includedSignature = await getSignature(includedSKL.Signature);

                if (isTimestampTooOld(getSignatureTime(localSignature), getSignatureTime(includedSignature))) {
                    addressesToVerifiedEpochs.set(address.ID, {
                        code: KT_STATUS.KT_FAILED,
                        error: 'Signed key list in localStorage is older than included signed key list by more than MAX_EPOCH_INTERVAL',
                    });
                    errorFlag = true;
                    break;
                }

                // Check signature
                try {
                    await checkSignature(
                        includedSKL.Data,
                        parsedKeyList.map((key) => key.PublicKey),
                        includedSKL.Signature,
                        'Included SKL localStorage self-audit (NOTE: the correct key might have been deleted)'
                    );
                } catch (error: any) {
                    addressesToVerifiedEpochs.set(address.ID, {
                        code: KT_STATUS.KT_FAILED,
                        error: error.message,
                    });
                    errorFlag = true;
                    break;
                }

                // If the includedSKL hasn't had time of entering an epoch, self-audit proceeds.
                // Otherwise, we check it's there.
                if (includedSKL.MinEpochID && includedSKL.MinEpochID !== null) {
                    const minEpoch = await fetchEpoch(includedSKL.MinEpochID, api);

                    const returnedDate = await verifyEpoch(minEpoch, email, includedSKL.Data, api);

                    if (isTimestampTooOld(getSignatureTime(localSignature), returnedDate)) {
                        addressesToVerifiedEpochs.set(address.ID, {
                            code: KT_STATUS.KT_FAILED,
                            error: 'Returned date is older than the signed key list in localStorage by more than MAX_EPOCH_INTERVAL',
                        });
                        errorFlag = true;
                        break;
                    }

                    try {
                        removeFromLS(i, address.ID);
                    } catch (error: any) {
                        addressesToVerifiedEpochs.set(address.ID, {
                            code: KT_STATUS.KT_FAILED,
                            error: `Removing object from localStorag failed with error "${error.message}"`,
                        });
                        errorFlag = true;
                        break;
                    }
                } else if (isTimestampTooOld(getSignatureTime(localSignature))) {
                    addressesToVerifiedEpochs.set(address.ID, {
                        code: KT_STATUS.KT_FAILED,
                        error: 'Signed key list in localStorage is older than MAX_EPOCH_INTERVAL',
                    });
                    errorFlag = true;
                    break;
                }
            }
        }
        if (errorFlag) {
            continue;
        }

        // Check key list and signed key list
        try {
            await verifyKeyLists(parsedKeyList, signedKeyListData);
        } catch (error: any) {
            addressesToVerifiedEpochs.set(address.ID, {
                code: KT_STATUS.KT_FAILED,
                error: `Mismatch found between key list and signed key list. ${error.message}`,
            });
            continue;
        }

        // Check signature
        try {
            await checkSignature(
                address.SignedKeyList.Data,
                parsedKeyList.map((key) => key.PublicKey),
                address.SignedKeyList.Signature,
                'Fetched SKL elf-audit'
            );
        } catch (error: any) {
            addressesToVerifiedEpochs.set(address.ID, {
                code: KT_STATUS.KT_FAILED,
                error: error.message,
            });
            continue;
        }

        // If its MinEpochID is null, the SKL must be recent
        const signatureSKL = await getSignature(address.SignedKeyList.Signature);
        if (address.SignedKeyList.MinEpochID === null && isTimestampTooOld(getSignatureTime(signatureSKL))) {
            addressesToVerifiedEpochs.set(address.ID, {
                code: KT_STATUS.KT_FAILED,
                error: 'Signed key list is older than MAX_EPOCH_INTERVAL',
            });
            continue;
        }

        // Fetch the last verified epoch. If there isn't any, the address is recent
        const verifiedEpoch = await fetchVerifiedEpoch(silentApi, address.ID);
        if (!verifiedEpoch) {
            // If the MinEpochID is null the address was created after the last epoch generation, therefore
            // self-audit is postponed at least until the SKL is included in the next epoch
            if (!address.SignedKeyList.MinEpochID || address.SignedKeyList.MinEpochID === null) {
                addressesToVerifiedEpochs.set(address.ID, {
                    code: KT_STATUS.KT_WARNING,
                    error: 'Signed key list has not been included in any epoch yet, self-audit is postponed',
                });
                continue;
            }

            // Otherwise, verify the epoch corresponding to its MinEpochID. Note that this can be arbitrarly
            // in the past, but that's ok because if we verified the SKL was in MinEpochID, then by construction
            // it has been kept in the tree until the current epoch.
            const minEpoch = await fetchEpoch(address.SignedKeyList.MinEpochID, api);

            let returnedDate;
            try {
                returnedDate = await verifyEpoch(minEpoch, email, address.SignedKeyList.Data, api);
            } catch (error: any) {
                addressesToVerifiedEpochs.set(address.ID, {
                    code: KT_STATUS.KT_FAILED,
                    error: error.message,
                });
                continue;
            }

            if (isTimestampTooOld(getSignatureTime(signatureSKL), returnedDate)) {
                addressesToVerifiedEpochs.set(address.ID, {
                    code: KT_STATUS.KT_FAILED,
                    error: 'MinEpochID certificate was issued more than MAX_EPOCH_INTERVAL after SKL generation',
                });
                continue;
            }

            const { Revision }: { Revision: number } = await fetchProof(minEpoch.EpochID, email, api);

            const verifiedCurrent = {
                ...minEpoch,
                Revision,
                CertificateDate: returnedDate,
            } as EpochExtended;

            addressesToVerifiedEpochs.set(address.ID, {
                code: KT_STATUS.KT_PASSED,
                verifiedEpoch: verifiedCurrent,
                error: '',
            });
            void uploadEpoch(verifiedCurrent, address, api);
            continue;
        }
        const verifiedEpochData: { EpochID: number; ChainHash: string; CertificateDate: number } = JSON.parse(
            verifiedEpoch.Data
        );

        // Check signature of verified epoch
        try {
            await checkSignature(
                verifiedEpoch.Data,
                parsedKeyList.map((key) => key.PublicKey),
                verifiedEpoch.Signature,
                'Verified epoch self-audit'
            );
        } catch (error: any) {
            addressesToVerifiedEpochs.set(address.ID, {
                code: KT_STATUS.KT_FAILED,
                error: error.message,
            });
            continue;
        }

        // Fetch all new SKLs and corresponding epochs
        const newSKLs = await fetchParsedSKLs(api, verifiedEpochData.EpochID, email, true);

        // There can be at most three SKLs in newSKLs:
        //   - the last one before verifiedEpochData.EpochID (i.e. the old one);
        //   - a new SKL uploaded between verifiedEpochData.EpochID and (verifiedEpochData.EpochID + 1)
        //   - a new SKL uploaded between (verifiedEpochData.EpochID + 1) and the current self-audit
        if (newSKLs.length === 0 || newSKLs.length > 3) {
            addressesToVerifiedEpochs.set(address.ID, {
                code: KT_STATUS.KT_FAILED,
                error: 'There should be between 1 and 3 fetched SKLs',
            });
            continue;
        }

        // The epochs are fetched according to when SKLs changed. There could be at most one SKL such that
        // MinEpochID is null, which is excluded because it does not belong to any epoch.
        const newEpochs: EpochExtended[] = await Promise.all(
            newSKLs
                .filter((skl) => skl.MinEpochID !== null)
                .map(async (skl) => {
                    const epoch = await fetchEpoch(skl.MinEpochID as number, api);

                    const { Revision }: { Revision: number } = await fetchProof(epoch.EpochID, email, api);

                    return {
                        ...epoch,
                        Revision,
                        CertificateDate: 0,
                    };
                })
        );
        // NOTE: if the old SKL hadn't been changed in a while, the first element of newSKLs can be arbitrarily old,
        // therefore the epoch corresponding to its MinEpochID will be older than verifiedEpoch.

        // Check revision consistency
        let checkRevision = true;
        for (let j = 1; j < newEpochs.length; j++) {
            checkRevision = checkRevision && newEpochs[j].Revision === newEpochs[j - 1].Revision + 1;
        }
        if (!checkRevision) {
            addressesToVerifiedEpochs.set(address.ID, {
                code: KT_STATUS.KT_FAILED,
                error: 'Revisions for new signed key lists have not been incremented correctly',
            });
            continue;
        }

        // If there aren't any new SKLs or if the latest SKL has MinEpochID equal to null,
        // then newEpochs will only have one element: the last one before verifiedEpochData.EpochID.
        if (newEpochs.length === 1) {
            // Extract the first SKL which, by construction of the getSignedKeyLists route, is the oldest
            const [oldSKL] = newSKLs;
            if (!oldSKL) {
                addressesToVerifiedEpochs.set(address.ID, {
                    code: KT_STATUS.KT_FAILED,
                    error: 'Existing SKL not found',
                });
                continue;
            }

            // Verify current epoch
            let verifiedCurrent;
            try {
                verifiedCurrent = await verifyCurrentEpoch(oldSKL, email, api);
            } catch (error: any) {
                addressesToVerifiedEpochs.set(address.ID, {
                    code: KT_STATUS.KT_FAILED,
                    error: error.message,
                });
                continue;
            }
            addressesToVerifiedEpochs.set(address.ID, {
                code: KT_STATUS.KT_PASSED,
                verifiedEpoch: verifiedCurrent,
                error: '',
            });
            void uploadEpoch(verifiedCurrent, address, api);
            continue;
        }

        // Extract the second SKL which, by construction of the getSignedKeyLists route, is immediately younger
        // or equal to the SKL given as input.
        const [, previousSKL] = newSKLs;
        if (!previousSKL) {
            addressesToVerifiedEpochs.set(address.ID, {
                code: KT_STATUS.KT_FAILED,
                error: 'Previous SKL not found',
            });
            continue;
        }

        // Check all new SKL in the corresponding epoch. At this point, newEpochs has 2 or 3
        // elements, the first of which has to be ignored because is is the old SKL.
        errorFlag = false;
        for (let j = 1; j < newEpochs.length; j++) {
            const epochToVerify = newEpochs[j];
            const previousEpoch = j === 1 ? verifiedEpochData : newEpochs[j - 1];

            // Verify the newest epoch
            if (epochToVerify.EpochID <= previousEpoch.EpochID) {
                addressesToVerifiedEpochs.set(address.ID, {
                    code: KT_STATUS.KT_FAILED,
                    error: 'Current epoch is older than or equal to verified epoch',
                });
                errorFlag = true;
                break;
            }

            const includedSKL =
                !address.SignedKeyList.MinEpochID ||
                address.SignedKeyList.MinEpochID === null ||
                address.SignedKeyList.MinEpochID > epochToVerify.EpochID
                    ? previousSKL
                    : address.SignedKeyList;

            if (!includedSKL) {
                addressesToVerifiedEpochs.set(address.ID, {
                    code: KT_STATUS.KT_FAILED,
                    error: 'Included SKL could not be defined',
                });
                errorFlag = true;
                break;
            }

            epochToVerify.CertificateDate = await verifyEpoch(epochToVerify, email, includedSKL.Data, api);

            if (
                epochToVerify.CertificateDate < previousEpoch.CertificateDate &&
                isTimestampTooOld(previousEpoch.CertificateDate, epochToVerify.CertificateDate)
            ) {
                addressesToVerifiedEpochs.set(address.ID, {
                    code: KT_STATUS.KT_FAILED,
                    error: 'Certificate date control error',
                });
                errorFlag = true;
                break;
            }

            if (
                (!address.SignedKeyList.MinEpochID ||
                    address.SignedKeyList.MinEpochID === null ||
                    address.SignedKeyList.MinEpochID > epochToVerify.EpochID) &&
                isTimestampTooOld(getSignatureTime(signatureSKL), epochToVerify.CertificateDate)
            ) {
                addressesToVerifiedEpochs.set(address.ID, {
                    code: KT_STATUS.KT_FAILED,
                    error: "The certificate date is older than signed key list's signature by more than MAX_EPOCH_INTERVAL",
                });
                errorFlag = true;
                break;
            }
        }
        if (errorFlag) {
            continue;
        }

        // Check latest certificate is within acceptable range
        if (isTimestampTooOld(newEpochs[newEpochs.length - 1].CertificateDate, getSignatureTime(signatureSKL))) {
            addressesToVerifiedEpochs.set(address.ID, {
                code: KT_STATUS.KT_FAILED,
                error: 'Last certificate date is older than the last signed key list by more than MAX_EPOCH_INTERVAL',
            });
            continue;
        }

        // Set output for current address
        addressesToVerifiedEpochs.set(address.ID, {
            code: KT_STATUS.KT_PASSED,
            verifiedEpoch: newEpochs[newEpochs.length - 1],
            error: '',
        });
        void uploadEpoch(newEpochs[newEpochs.length - 1], address, api);
    }

    return addressesToVerifiedEpochs;
};

/**
 * Verify that self-audit has run correctly before modifying any key
 */
export const verifySelfAuditResult = async (
    address: Address | undefined,
    submittedSKL: SignedKeyList,
    ktSelfAuditResult: Map<string, KTInfoSelfAudit>,
    lastSelfAudit: number,
    isRunning: boolean,
    api: Api
): Promise<KTInfoToLS> => {
    if (!address) {
        throw new Error('Address is undefined');
    }

    if (isRunning) {
        throw new Error('Self-audit is still running');
    }

    if (Date.now() - lastSelfAudit > EXP_EPOCH_INTERVAL) {
        throw new Error('Self-audit should run before proceeding');
    }

    const ktResult = ktSelfAuditResult.get(address.ID);

    if (!ktResult) {
        throw new Error(`${address.Email} was not audited`);
    }

    if (ktResult.code === KT_STATUS.KT_FAILED) {
        throw new Error(`Self-audit failed for ${address.Email} with error "${ktResult.error}"`);
    }

    let verifiedEpoch;
    if (ktResult.code === KT_STATUS.KT_WARNING) {
        // Last epoch before address creation
        const lastEpochID = await fetchLastEpoch(api);
        const lastEpoch = await fetchEpoch(lastEpochID, api);
        const lastEpochCert = parseCertChain(lastEpoch.Certificate)[0];
        verifiedEpoch = {
            ...lastEpoch,
            Revision: 0,
            CertificateDate: lastEpochCert.notBefore.value.getTime(),
        };
    } else {
        verifiedEpoch = ktResult.verifiedEpoch;
    }

    if (!verifiedEpoch) {
        throw new Error('Verified epoch not found');
    }

    if (
        isTimestampTooOld(verifiedEpoch.CertificateDate, getSignatureTime(await getSignature(submittedSKL.Signature)))
    ) {
        throw new Error(`Verified epoch for ${address.Email} has invalid CertificateDate`);
    }

    return {
        message: JSON.stringify({
            EpochID: verifiedEpoch.EpochID,
            SignedKeyList: submittedSKL,
        }),
        addressID: address.ID,
    };
};

/**
 * Commit changes to SKLs to local storage for later checking
 */
export const ktSaveToLS = async (messageObject: KTInfoToLS | undefined, userKeys: KeyPair[] | undefined, api: Api) => {
    if (!messageObject) {
        throw new Error('Message object not found');
    }

    const { message, addressID } = messageObject;

    if (hasStorage()) {
        const userKey = userKeys ? userKeys[0].publicKey : undefined;
        if (!userKey) {
            throw new Error('Missing primary user key');
        }

        // Check if there is something in localStorage with counter either 0 or 1 and the previous or current epoch
        // Format is kt:{counter}:{addressID}:{epoch}, therefore splitKey = [kt, {counter}, {addressID}, {epoch}].
        const ktBlobs = getKTBlobs(addressID);
        const currentEpoch = await fetchLastEpoch(api);
        let counter = 0;

        switch (ktBlobs.size) {
            case 0:
                break;
            case 1: {
                const key: string = ktBlobs.keys().next().value;
                const [counterBlob, , epochBlob] = key
                    .split(':')
                    .slice(1)
                    .map((n) => +n);
                if (epochBlob > currentEpoch) {
                    throw new Error('Inconsistent data in localStorage');
                }
                if (counterBlob !== 0) {
                    removeItem(key);
                    setItem(`kt:0:${addressID}:${epochBlob}`, ktBlobs.get(key) as string);
                }
                counter = epochBlob !== currentEpoch ? 1 : 0;
                break;
            }
            case 2: {
                for (const element of ktBlobs) {
                    const [key] = element;
                    const [counterBlob, , epochBlob] = key
                        .split(':')
                        .slice(1)
                        .map((n) => +n);
                    if (counterBlob === 0) {
                        if (epochBlob >= currentEpoch) {
                            throw new Error('Inconsistent data in localStorage');
                        }
                    } else {
                        if (epochBlob > currentEpoch) {
                            throw new Error('Inconsistent data in localStorage');
                        }
                        counter = 1;
                    }
                }
                break;
            }
            default:
                throw new Error('There are too many blobs in localStorage');
        }

        // Save the new blob
        setItem(
            `kt:${counter}:${addressID}:${currentEpoch}`,
            (
                await encryptMessage({
                    data: message,
                    publicKeys: userKey,
                })
            ).data
        );
    }
};
