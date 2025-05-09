import { useRef } from 'react';

import { fromUnixTime, isAfter } from 'date-fns';
import { c } from 'ttag';

import type { PrivateKeyReference, SessionKey } from '@proton/crypto';
import { CryptoProxy, VERIFICATION_STATUS } from '@proton/crypto';
import { queryFileRevision, queryFileRevisionThumbnail } from '@proton/shared/lib/api/drive/files';
import { queryGetLink } from '@proton/shared/lib/api/drive/link';
import { RESPONSE_CODE } from '@proton/shared/lib/drive/constants';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';
import type {
    DriveFileRevisionResult,
    DriveFileRevisionThumbnailResult,
} from '@proton/shared/lib/interfaces/drive/file';
import type { LinkMetaResult } from '@proton/shared/lib/interfaces/drive/link';
import { decryptSigned } from '@proton/shared/lib/keys/driveKeys';
import type { VerificationKeysCallback } from '@proton/shared/lib/keys/drivePassphrase';
import { decryptPassphrase, getDecryptedSessionKey } from '@proton/shared/lib/keys/drivePassphrase';

import { isIgnoredError, isIgnoredErrorForReporting, sendErrorReport } from '../../utils/errorHandling';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { getIsPublicContext } from '../../utils/getIsPublicContext';
import type { MetricUserPlan } from '../../utils/type/MetricTypes';
import { tokenIsValid } from '../../utils/url/token';
import { linkMetaToEncryptedLink, revisionPayloadToRevision, useDebouncedRequest } from '../_api';
import type { IntegrityMetrics, VerificationKey } from '../_crypto';
import { integrityMetrics, useDriveCrypto } from '../_crypto';
import {
    type Share,
    ShareType,
    type ShareTypeStringWithPublic,
    type ShareWithKey,
    getShareTypeString,
    useDefaultShare,
    useShare,
} from '../_shares';
import { useDirectSharingInfo } from '../_shares/useDirectSharingInfo';
import { useGetMetricsUserPlan } from '../_user/useGetMetricsUserPlan';
import { useDebouncedFunction } from '../_utils';
import { decryptExtendedAttributes } from './extendedAttributes';
import type { DecryptedLink, EncryptedLink, SignatureIssueLocation, SignatureIssues } from './interface';
import { isDecryptedLinkSame } from './link';
import useLinksKeys from './useLinksKeys';
import useLinksState from './useLinksState';

// Interval should not be too low to not cause spikes on the server but at the
// same time not too high to not overflow available memory on the device.
const FAILING_FETCH_BACKOFF_MS = 10 * 60 * 1000; // 10 minutes.
const generateCorruptDecryptedLink = (encryptedLink: EncryptedLink, name: string): DecryptedLink => ({
    encryptedName: encryptedLink.name,
    name,
    type: encryptedLink.type,
    linkId: encryptedLink.linkId,
    createTime: encryptedLink.createTime,
    corruptedLink: true,
    activeRevision: encryptedLink.activeRevision,
    digests: { sha1: '' },
    hash: encryptedLink.hash,
    size: encryptedLink.size,
    originalSize: encryptedLink.size,
    fileModifyTime: encryptedLink.metaDataModifyTime,
    metaDataModifyTime: encryptedLink.metaDataModifyTime,
    isFile: encryptedLink.isFile,
    mimeType: encryptedLink.mimeType,
    hasThumbnail: encryptedLink.hasThumbnail,
    isShared: encryptedLink.isShared,
    parentLinkId: encryptedLink.parentLinkId,
    rootShareId: encryptedLink.rootShareId,
    signatureIssues: encryptedLink.signatureIssues,
    originalDimensions: {
        height: 0,
        width: 0,
    },
    trashed: encryptedLink.trashed,
    volumeId: encryptedLink.volumeId,
});

export default function useLink() {
    const linksKeys = useLinksKeys();
    const linksState = useLinksState();
    const { getVerificationKey } = useDriveCrypto();
    const { getSharePrivateKey, getShare } = useShare();
    const { getDefaultShareAddressEmail } = useDefaultShare();
    const { getDirectSharingInfo } = useDirectSharingInfo();

    const userPlan = useGetMetricsUserPlan();

    const debouncedRequest = useDebouncedRequest();
    const fetchLink = async (abortSignal: AbortSignal, shareId: string, linkId: string): Promise<EncryptedLink> => {
        const { Link } = await debouncedRequest<LinkMetaResult>(
            {
                ...queryGetLink(shareId, linkId),
                // Ignore HTTP errors (e.g. "Not Found", "Unprocessable Entity"
                // etc). Not every `fetchLink` call relates to a user action
                // (it might be a helper function for a background job). Hence,
                // there are potential cases when displaying such messages will
                // confuse the user. Every higher-level caller should handle it
                // based on the context.
                silence: true,
            },
            abortSignal
        );
        return linkMetaToEncryptedLink(Link, shareId);
    };

    return useLinkInner(
        fetchLink,
        linksKeys,
        linksState,
        getVerificationKey,
        getSharePrivateKey,
        getShare,
        getDefaultShareAddressEmail,
        getDirectSharingInfo,
        userPlan,
        integrityMetrics,
        CryptoProxy.importPrivateKey
    );
}

export function useLinkInner(
    fetchLink: (abortSignal: AbortSignal, shareId: string, linkId: string) => Promise<EncryptedLink>,
    linksKeys: Pick<
        ReturnType<typeof useLinksKeys>,
        | 'getPassphrase'
        | 'setPassphrase'
        | 'getPassphraseSessionKey'
        | 'setPassphraseSessionKey'
        | 'getPrivateKey'
        | 'setPrivateKey'
        | 'getSessionKey'
        | 'setSessionKey'
        | 'getHashKey'
        | 'setHashKey'
    >,
    linksState: Pick<ReturnType<typeof useLinksState>, 'getLink' | 'setLinks' | 'setCachedThumbnail'>,
    getVerificationKey: ReturnType<typeof useDriveCrypto>['getVerificationKey'],
    getSharePrivateKey: ReturnType<typeof useShare>['getSharePrivateKey'],
    getShare: ReturnType<typeof useShare>['getShare'],
    getDefaultShareAddressEmail: ReturnType<typeof useDefaultShare>['getDefaultShareAddressEmail'],
    getDirectSharingInfo: ReturnType<typeof useDirectSharingInfo>['getDirectSharingInfo'],
    userPlan: MetricUserPlan,
    integrityMetrics: IntegrityMetrics,
    importPrivateKey: typeof CryptoProxy.importPrivateKey // passed as arg for easier mocking when testing
) {
    const debouncedFunction = useDebouncedFunction();
    const debouncedRequest = useDebouncedRequest();

    // Cache certain API errors in order to avoid sending multiple requests to
    // the same failing link. For example, trying to fetch the same missing
    // parent link for multiple descendants (when processing already outdated
    // events).
    const linkFetchErrors = useRef<{ [key: string]: any }>({});

    const fetchLinkDONOTUSE = fetchLink;
    fetchLink = async (abortSignal: AbortSignal, shareId: string, linkId: string): Promise<EncryptedLink> => {
        const err = linkFetchErrors.current[shareId + linkId];
        if (err) {
            throw err;
        }

        return fetchLinkDONOTUSE(abortSignal, shareId, linkId).catch((err) => {
            if (
                [RESPONSE_CODE.NOT_FOUND, RESPONSE_CODE.NOT_ALLOWED, RESPONSE_CODE.INVALID_ID].includes(err?.data?.Code)
            ) {
                linkFetchErrors.current[shareId + linkId] = err;
                setTimeout(() => {
                    delete linkFetchErrors.current[shareId + linkId];
                }, FAILING_FETCH_BACKOFF_MS);
            }
            throw err;
        });
    };

    const loadShareTypeString = async (shareId: string): Promise<ShareTypeStringWithPublic> => {
        if (getIsPublicContext()) {
            return 'shared_public';
        }
        return (
            getShare(new AbortController().signal, shareId)
                .then(getShareTypeString)
                // getShare should be fast call as share is already cached by this time.
                // In case of failure, fallback 'shared' is good assumption as it might
                // mean some edge case for sharing.
                // After refactor, this should be handled better.
                .catch(() => 'shared')
        );
    };

    const handleDecryptionError = (shareId: string, encryptedLink: EncryptedLink) => {
        void loadShareTypeString(shareId).then((shareType) => {
            const options = {
                plan: userPlan,
                createTime: encryptedLink.createTime,
            };
            integrityMetrics.nodeDecryptionError(encryptedLink.linkId, shareType, options);
        });
    };

    const reportSignatureError = (shareId: string, encryptedLink: EncryptedLink, location: SignatureIssueLocation) => {
        // This means that the shareId is a token for a public link (bookmarking) and does not need signatureCheck
        // Exemple:
        // - shareId: D4TVgdFKidFgQWd5IeXYyegjDNV9KWF1HDwjxZlesUo-Wc2NTL8mUQc6IlYwowznc5vHQkTL4iUbn6K0CorrjQ==
        // - token: 2NR85F8NSC
        if (tokenIsValid(shareId)) {
            return;
        }
        void loadShareTypeString(shareId).then(async (shareType) => {
            const email = await getDefaultShareAddressEmail();
            const verificationKey = {
                passphrase: 'SignatureEmail',
                hash: 'NodeKey',
                name: 'NameSignatureEmail',
                xattrs: 'SignatureEmail',
                contentKeyPacket: 'NodeKey',
                blocks: 'NodeKey',
                thumbnail: 'NodeKey',
                manifest: 'NodeKey',
            }[location] as VerificationKey;

            const options = {
                plan: userPlan,
                createTime: encryptedLink.createTime,
                addressMatchingDefaultShare: encryptedLink.signatureEmail === email,
            };
            integrityMetrics.signatureVerificationError(encryptedLink.linkId, shareType, verificationKey, options);
        });
    };

    const handleSignatureCheck = (
        shareId: string,
        encryptedLink: EncryptedLink,
        location: SignatureIssueLocation,
        verificationStatus: VERIFICATION_STATUS
    ) => {
        if (verificationStatus !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
            const signatureIssues: SignatureIssues = {};
            signatureIssues[location] = verificationStatus;
            linksState.setLinks(shareId, [
                {
                    encrypted: {
                        ...encryptedLink,
                        signatureIssues,
                    },
                },
            ]);

            reportSignatureError(shareId, encryptedLink, location);
        }
    };

    /**
     * debouncedFunctionDecorator wraps original callback with debouncedFunction
     * to ensure that if even two or more calls with the same parameters are
     * executed only once. E.g., to not decrypt the same link keys twice.
     */
    const debouncedFunctionDecorator = <T>(
        cacheKey: string,
        callback: (abortSignal: AbortSignal, shareId: string, linkId: string) => Promise<T>
    ): ((abortSignal: AbortSignal, shareId: string, linkId: string) => Promise<T>) => {
        const wrapper = async (abortSignal: AbortSignal, shareId: string, linkId: string): Promise<T> => {
            return debouncedFunction(
                async (abortSignal: AbortSignal) => {
                    return callback(abortSignal, shareId, linkId);
                },
                [cacheKey, shareId, linkId],
                abortSignal
            );
        };
        return wrapper;
    };

    const getEncryptedLink = debouncedFunctionDecorator(
        'getEncryptedLink',
        async (abortSignal: AbortSignal, shareId: string, linkId: string): Promise<EncryptedLink> => {
            const cachedLink = linksState.getLink(shareId, linkId);
            if (cachedLink) {
                return cachedLink.encrypted;
            }
            const link = await fetchLink(abortSignal, shareId, linkId);
            linksState.setLinks(shareId, [{ encrypted: link }]);
            return link;
        }
    );

    /**
     * getLinkPassphraseAndSessionKey returns the passphrase with session key
     * used for locking the private key.
     */
    const getLinkPassphraseAndSessionKey = debouncedFunctionDecorator(
        'getLinkPassphraseAndSessionKey',
        async (
            abortSignal: AbortSignal,
            shareId: string,
            linkId: string
        ): Promise<{ passphrase: string; passphraseSessionKey: SessionKey; encryptedLink?: EncryptedLink }> => {
            const passphrase = linksKeys.getPassphrase(shareId, linkId);
            const sessionKey = linksKeys.getPassphraseSessionKey(shareId, linkId);
            if (passphrase && sessionKey) {
                return { passphrase, passphraseSessionKey: sessionKey };
            }

            const encryptedLink = await getEncryptedLink(abortSignal, shareId, linkId);

            let privateKey: PrivateKeyReference | undefined;
            let privateKeyError;

            try {
                const parentPrivateKey = encryptedLink.parentLinkId
                    ? // eslint-disable-next-line @typescript-eslint/no-use-before-define
                      await getLinkPrivateKey(abortSignal, shareId, encryptedLink.parentLinkId)
                    : await getSharePrivateKey(abortSignal, shareId);
                privateKey = parentPrivateKey;
            } catch (e) {
                privateKeyError = e;
                // ignore failures but still report them to Sentry
                sendErrorReport(e, {
                    extra: {
                        message: 'getLinkPassphraseAndSessionKey() - Failed to get parentPrivateKey',
                    },
                });
            }

            if (encryptedLink.photoProperties?.albums.length && !encryptedLink.parentLinkId) {
                for (const album of encryptedLink.photoProperties.albums) {
                    try {
                        // eslint-disable-next-line @typescript-eslint/no-use-before-define
                        const albumPrivateKey = await getLinkPrivateKey(abortSignal, shareId, album.albumLinkId);
                        privateKey = albumPrivateKey;
                        // we can break at first album since it's enough to decrypt / for optimization
                        break;
                    } catch (e) {
                        // ignore failures but still report them to Sentry
                        sendErrorReport(e, {
                            extra: {
                                message: 'getLinkPassphraseAndSessionKey() - Failed to get albumPrivateKey',
                            },
                        });
                    }
                }
            }

            if (!privateKey) {
                if (abortSignal.aborted) {
                    throw privateKeyError;
                }
                // This should never happen. If you see this error in Sentry something is wrong
                throw new EnrichedError('No private key was found during getLinkPassphraseAndSessionKey', {
                    tags: {
                        shareId,
                        linkId,
                    },
                    extra: { e: privateKeyError, crypto: true },
                });
            }

            const addressPublicKey = encryptedLink.signatureEmail
                ? await getVerificationKey(encryptedLink.signatureEmail)
                : [];

            try {
                // Fallback to parent NodeKey in case if we don't have addressPublicKey (Anonymous upload)
                const publicKeysCallbackList: VerificationKeysCallback[] = [
                    async () => (encryptedLink.signatureEmail ? addressPublicKey : [privateKey]),
                ];

                const {
                    decryptedPassphrase,
                    sessionKey: passphraseSessionKey,
                    verificationStatus,
                } = await decryptPassphrase({
                    armoredPassphrase: encryptedLink.nodePassphrase,
                    armoredSignature: encryptedLink.nodePassphraseSignature,
                    privateKeys: [privateKey],
                    publicKeysCallbackList,
                });

                handleSignatureCheck(shareId, encryptedLink, 'passphrase', verificationStatus);

                linksKeys.setPassphrase(shareId, linkId, decryptedPassphrase);
                linksKeys.setPassphraseSessionKey(shareId, linkId, passphraseSessionKey);

                return {
                    passphrase: decryptedPassphrase,
                    passphraseSessionKey,
                    encryptedLink,
                };
            } catch (e) {
                throw new EnrichedError('Failed to decrypt link passphrase', {
                    tags: {
                        shareId,
                        linkId,
                    },
                    extra: { e, crypto: true },
                });
            }
        }
    );

    /**
     * getLinkPrivateKey returns the private key used for link meta data encryption.
     */
    const getLinkPrivateKey = debouncedFunctionDecorator(
        'getLinkPrivateKey',
        async (abortSignal: AbortSignal, shareId: string, linkId: string): Promise<PrivateKeyReference> => {
            let privateKey = linksKeys.getPrivateKey(shareId, linkId);
            if (privateKey) {
                return privateKey;
            }

            // getLinkPassphraseAndSessionKey already call getEncryptedLink, prevent to call fetchLink twice
            let { passphrase, encryptedLink } = await getLinkPassphraseAndSessionKey(abortSignal, shareId, linkId);
            encryptedLink = encryptedLink || (await getEncryptedLink(abortSignal, shareId, linkId));
            try {
                privateKey = await importPrivateKey({ armoredKey: encryptedLink.nodeKey, passphrase });
            } catch (e) {
                throw new EnrichedError('Failed to import link private key', {
                    tags: {
                        shareId,
                        linkId,
                    },
                    extra: { e, crypto: true },
                });
            }

            linksKeys.setPrivateKey(shareId, linkId, privateKey);
            return privateKey;
        }
    );

    /**
     * getLinkSessionKey returns the session key used for block encryption.
     */
    const getLinkSessionKey = debouncedFunctionDecorator(
        'getLinkSessionKey',
        async (abortSignal: AbortSignal, shareId: string, linkId: string): Promise<SessionKey> => {
            let sessionKey = linksKeys.getSessionKey(shareId, linkId);
            if (sessionKey) {
                return sessionKey;
            }

            const encryptedLink = await getEncryptedLink(abortSignal, shareId, linkId);
            if (!encryptedLink.contentKeyPacket) {
                // This is dev error, should not happen in the wild.
                throw new Error('Content key is available only in file context');
            }

            const privateKey = await getLinkPrivateKey(abortSignal, shareId, linkId);

            const blockKeys = base64StringToUint8Array(encryptedLink.contentKeyPacket);

            try {
                sessionKey = await getDecryptedSessionKey({
                    data: blockKeys,
                    privateKeys: privateKey,
                });
            } catch (e) {
                throw new EnrichedError('Failed to decrypt link session key', {
                    tags: {
                        shareId,
                        linkId,
                    },
                    extra: { e, crypto: true },
                });
            }

            if (encryptedLink.contentKeyPacketSignature) {
                const publicKeys = [privateKey, ...(await getVerificationKey(encryptedLink.signatureEmail))];
                const { verificationStatus } = await CryptoProxy.verifyMessage({
                    binaryData: sessionKey.data,
                    verificationKeys: publicKeys,
                    armoredSignature: encryptedLink.contentKeyPacketSignature,
                });
                // iOS signed content key instead of session key in the past.
                // Therefore we need to check that as well until we migrate
                // old files.
                if (verificationStatus !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
                    const { verificationStatus: blockKeysVerified } = await CryptoProxy.verifyMessage({
                        binaryData: blockKeys,
                        verificationKeys: publicKeys,
                        armoredSignature: encryptedLink.contentKeyPacketSignature,
                    });
                    if (blockKeysVerified !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
                        // If even fall back solution does not succeed, report
                        // the original verified status of the session key as
                        // that one is the one we want to verify here.
                        handleSignatureCheck(shareId, encryptedLink, 'contentKeyPacket', verificationStatus);
                    }
                }
            }

            linksKeys.setSessionKey(shareId, linkId, sessionKey);
            return sessionKey;
        }
    );

    /**
     * getLinkHashKey returns the hash key used for checking name collisions.
     */
    const getLinkHashKey = debouncedFunctionDecorator(
        'getLinkHashKey',
        async (abortSignal: AbortSignal, shareId: string, linkId: string): Promise<Uint8Array> => {
            let cachedHashKey = linksKeys.getHashKey(shareId, linkId);
            if (cachedHashKey) {
                return cachedHashKey;
            }

            const encryptedLink = await getEncryptedLink(abortSignal, shareId, linkId);
            if (!encryptedLink.nodeHashKey) {
                // This is dev error, should not happen in the wild.
                throw new Error('Hash key is available only in folder or albums context');
            }

            const [privateKey, addressPrivateKey] = await Promise.all([
                getLinkPrivateKey(abortSignal, shareId, linkId),
                getVerificationKey(encryptedLink.signatureEmail),
            ]);
            // In the past we had misunderstanding what key is used to sign
            // hash key. Originally it meant to be node key, which web used
            // for all links besides the root one, where address key was
            // used instead. Similarly, iOS or Android used address key for
            // all links. Latest versions should use node key in all cases
            // but we accept also address key. Its still signed with valid
            // key. In future we might re-sign bad links so we can get rid
            // of this.
            const publicKey = [privateKey, ...addressPrivateKey];

            try {
                const { data: hashKey, verificationStatus } = await decryptSigned({
                    armoredMessage: encryptedLink.nodeHashKey,
                    privateKey,
                    publicKey,
                    format: 'binary',
                });

                if (
                    verificationStatus === VERIFICATION_STATUS.SIGNED_AND_INVALID ||
                    // The hash was not signed until Beta 17 (DRVWEB-1219).
                    (verificationStatus === VERIFICATION_STATUS.NOT_SIGNED &&
                        isAfter(fromUnixTime(encryptedLink.createTime), new Date(2021, 7, 1)))
                ) {
                    handleSignatureCheck(shareId, encryptedLink, 'hash', verificationStatus);
                }

                linksKeys.setHashKey(shareId, linkId, hashKey);
                return hashKey;
            } catch (e) {
                throw new EnrichedError('Failed to decrypt link hash key', {
                    tags: {
                        shareId,
                        linkId,
                    },
                    extra: { e, crypto: true },
                });
            }
        }
    );

    const getLinkRevision = async (
        abortSignal: AbortSignal,
        { shareId, linkId, revisionId }: { shareId: string; linkId: string; revisionId: string }
    ) => {
        const { Revision } = await debouncedRequest<DriveFileRevisionResult>(
            queryFileRevision(shareId, linkId, revisionId),
            abortSignal
        );
        return revisionPayloadToRevision(Revision);
    };

    /**
     * decryptLink decrypts provided `encryptedLink`. The result is not stored
     * anywhere, only returned back.
     */
    const decryptLink = async (
        abortSignal: AbortSignal,
        shareId: string,
        encryptedLink: EncryptedLink,
        revisionId?: string,
        share?: ShareWithKey | Share
    ): Promise<DecryptedLink> => {
        return debouncedFunction(
            async (abortSignal: AbortSignal): Promise<DecryptedLink> => {
                let privateKey: PrivateKeyReference | undefined;
                let privateKeyError;

                try {
                    const parentPrivateKey: PrivateKeyReference = encryptedLink.parentLinkId
                        ? await getLinkPrivateKey(abortSignal, shareId, encryptedLink.parentLinkId)
                        : await getSharePrivateKey(abortSignal, shareId);

                    privateKey = parentPrivateKey;
                } catch (e) {
                    privateKeyError = e;
                    // ignore failures but still report them to Sentry
                    sendErrorReport(e, {
                        extra: {
                            message: 'decryptLink() - Failed to get parentPrivateKey',
                        },
                    });
                }

                if (encryptedLink.photoProperties?.albums.length && !encryptedLink.parentLinkId) {
                    for (const album of encryptedLink.photoProperties.albums) {
                        try {
                            const albumPrivateKey = await getLinkPrivateKey(abortSignal, shareId, album.albumLinkId);
                            privateKey = albumPrivateKey;
                            // we can break at first album since it's enough to decrypt / for optimization
                            break;
                        } catch (e) {
                            // ignore failures but still report them to Sentry
                            sendErrorReport(e, {
                                extra: {
                                    message: 'decryptLink() - Failed to get albumPrivateKey',
                                },
                            });
                        }
                    }
                }

                if (!privateKey) {
                    if (abortSignal.aborted) {
                        throw privateKeyError;
                    }
                    // This should never happen. If you see this error in Sentry something is wrong
                    throw new EnrichedError('No private key was found during decryptLink', {
                        tags: {
                            shareId,
                            linkId: encryptedLink.linkId,
                        },
                        extra: { e: privateKeyError, crypto: true },
                    });
                }
                const namePromise = new Promise<{ name: string; nameVerified: VERIFICATION_STATUS }>(
                    async (resolve, reject) => {
                        try {
                            const signatureEmail = encryptedLink.nameSignatureEmail || encryptedLink.signatureEmail;
                            const publicKey = signatureEmail ? await getVerificationKey(signatureEmail) : [privateKey];
                            const { data, verificationStatus } = await decryptSigned({
                                armoredMessage: encryptedLink.name,
                                privateKey,
                                // nameSignatureEmail is missing for some old files.
                                // Fallback to signatureEmail might result in failed
                                // signature check, but no one reported it so far so
                                // we should be good. Important is that user can access
                                // the file and the verification do not hard fail.
                                // If we find out that it doesnt work for some user,
                                // we could skip the verification instead. But the best
                                // would be to fix it properly in the database.
                                publicKey,
                            });
                            resolve({ name: data, nameVerified: verificationStatus });
                        } catch (error) {
                            reject(error);
                        }
                    }
                );

                const revision = !!revisionId
                    ? await getLinkRevision(abortSignal, { shareId, linkId: encryptedLink.linkId, revisionId })
                    : undefined;
                // Files have signature address on the revision.
                // Folders have signature address on the link itself.
                const signatureEmail = encryptedLink.isFile
                    ? revision?.signatureEmail || encryptedLink.activeRevision?.signatureEmail
                    : encryptedLink.signatureEmail;

                const xattrPromise = !encryptedLink.xAttr
                    ? {
                          fileModifyTime: encryptedLink.metaDataModifyTime,
                          fileModifyTimeVerified: VERIFICATION_STATUS.SIGNED_AND_VALID,
                          originalSize: undefined,
                          originalDimensions: undefined,
                          digests: undefined,
                          duration: undefined,
                      }
                    : getLinkPrivateKey(abortSignal, shareId, encryptedLink.linkId)
                          .then(async (privateKey) =>
                              decryptExtendedAttributes(
                                  encryptedLink.xAttr,
                                  privateKey,

                                  signatureEmail ? await getVerificationKey(signatureEmail) : privateKey
                              )
                          )
                          .then(({ xattrs, verificationStatus }) => ({
                              fileModifyTime: xattrs.Common.ModificationTime || encryptedLink.metaDataModifyTime,
                              fileModifyTimeVerified: verificationStatus,
                              originalSize: xattrs.Common?.Size,
                              originalDimensions: xattrs.Media
                                  ? {
                                        width: xattrs.Media.Width,
                                        height: xattrs.Media.Height,
                                    }
                                  : undefined,
                              duration: xattrs.Media?.Duration,
                              digests: xattrs.Common?.Digests
                                  ? {
                                        sha1: xattrs.Common.Digests.SHA1,
                                    }
                                  : undefined,
                          }));

                const [nameResult, xattrResult] = await Promise.allSettled([namePromise, xattrPromise]);

                if (nameResult.status === 'rejected') {
                    // 'AbortError' signify the user has navigated away mid-decryption
                    // We don't count this as error in our metrics
                    if (nameResult.reason instanceof Error && isIgnoredErrorForReporting(nameResult.reason)) {
                        return generateCorruptDecryptedLink(encryptedLink, '�');
                    }
                    sendErrorReport(
                        new EnrichedError(
                            nameResult.reason instanceof Error
                                ? nameResult.reason.message
                                : nameResult.reason.toString(),
                            {
                                tags: {
                                    attribute: 'name',
                                    shareId,
                                    linkId: encryptedLink.linkId,
                                    revisionId: revisionId || encryptedLink.activeRevision?.id,
                                },
                                extra: { e: nameResult.reason },
                            },
                            'Decryption error'
                        )
                    );
                    handleDecryptionError(shareId, encryptedLink);
                    return generateCorruptDecryptedLink(encryptedLink, '�');
                }

                const { nameVerified, name } = nameResult.value;

                const signatureIssues: SignatureIssues = {};
                if (
                    nameVerified === VERIFICATION_STATUS.SIGNED_AND_INVALID ||
                    // The name was not signed until Beta 3 (DRVWEB-673).
                    (nameVerified === VERIFICATION_STATUS.NOT_SIGNED &&
                        isAfter(fromUnixTime(encryptedLink.createTime), new Date(2021, 0, 1)))
                ) {
                    reportSignatureError(shareId, encryptedLink, 'name');
                    signatureIssues.name = nameVerified;
                }

                if (xattrResult.status === 'rejected') {
                    // 'AbortError' signify the user has navigated away mid-decryption
                    // We don't count this as error in our metrics
                    if (xattrResult.reason instanceof Error && isIgnoredErrorForReporting(xattrResult.reason)) {
                        return generateCorruptDecryptedLink(encryptedLink, name);
                    }

                    sendErrorReport(
                        new EnrichedError(
                            xattrResult.reason instanceof Error
                                ? xattrResult.reason.message
                                : xattrResult.reason.toString(),
                            {
                                tags: {
                                    attribute: 'xattr',
                                    shareId,
                                    linkId: encryptedLink.linkId,
                                    revisionId: revisionId || encryptedLink.activeRevision?.id,
                                },
                                extra: { e: xattrResult.reason },
                            },
                            'Decryption error'
                        )
                    );
                    handleDecryptionError(shareId, encryptedLink);
                    return generateCorruptDecryptedLink(encryptedLink, name);
                }
                const { fileModifyTimeVerified, fileModifyTime, originalSize, originalDimensions, digests, duration } =
                    xattrResult.value;

                if (fileModifyTimeVerified !== VERIFICATION_STATUS.SIGNED_AND_VALID) {
                    reportSignatureError(shareId, encryptedLink, 'xattrs');
                    signatureIssues.xattrs = fileModifyTimeVerified;
                }

                // Share will already be in cache due to getSharePrivateKey above
                const shareResult = !encryptedLink.parentLinkId
                    ? share || (await getShare(abortSignal, shareId))
                    : undefined;

                // Sharing info will only be get in case the share is not own by the current user
                // Also we only want it in the shared with me root view, so we need to check if parentLinkId is not present
                // TODO: Improve that as we remove the parentLinkId for now, but it will be present in the future
                let sharingInfo =
                    !getIsPublicContext() && encryptedLink.sharingDetails && !encryptedLink.parentLinkId
                        ? await getDirectSharingInfo(abortSignal, encryptedLink.sharingDetails?.shareId)
                        : undefined;

                let displayName = name;
                if (shareResult?.type === ShareType.default) {
                    displayName = c('Title').t`My files`;
                } else if (shareResult?.type === ShareType.photos) {
                    displayName = c('Title').t`Photos`;
                }

                return {
                    ...encryptedLink,
                    ...(sharingInfo ? { sharedOn: sharingInfo.sharedOn, sharedBy: sharingInfo.sharedBy } : undefined),
                    isAnonymous: !signatureEmail,
                    encryptedName: encryptedLink.name,
                    name: displayName,
                    fileModifyTime: fileModifyTime,
                    originalSize,
                    originalDimensions,
                    duration,
                    signatureIssues: Object.keys(signatureIssues).length > 0 ? signatureIssues : undefined,
                    digests,
                };
            },
            ['decryptLink', shareId, encryptedLink.linkId],
            abortSignal
        );
    };

    /**
     * getLInk provides decrypted link. If the cached link is available, it is
     * returned right away. In other cases it might first fetch link from API,
     * or just decrypt the encrypted cached one. If the decrypted link is stale
     * (that means new version of encrypted link was fetched but not decrypted
     * yet), it is first re-decrypted.
     */
    const getLink = debouncedFunctionDecorator(
        'getLink',
        async (abortSignal: AbortSignal, shareId: string, linkId: string): Promise<DecryptedLink> => {
            const cachedLink = linksState.getLink(shareId, linkId);
            if (cachedLink && cachedLink.decrypted && !cachedLink.decrypted.isStale) {
                return cachedLink.decrypted;
            }

            const encrypted = await getEncryptedLink(abortSignal, shareId, linkId);

            try {
                const decrypted = await decryptLink(abortSignal, shareId, encrypted);

                linksState.setLinks(shareId, [{ encrypted, decrypted }]);

                return decrypted;
            } catch (e) {
                if (isIgnoredError(e)) {
                    return generateCorruptDecryptedLink(encrypted, '�');
                }

                throw new EnrichedError('Failed to decrypt link', {
                    tags: {
                        shareId,
                        linkId,
                    },
                    extra: { e, crypto: true },
                });
            }
        }
    );

    /**
     * loadFreshLink always fetches the fresh link meta data from API, but
     * the decryption is done only when its needed. Anyway, this should be
     * used only when really needed, for example, if we need to make sure if
     * the link doesn't have any shared link already before creating new one.
     */
    const loadFreshLink = async (abortSignal: AbortSignal, shareId: string, linkId: string): Promise<DecryptedLink> => {
        const cachedLink = linksState.getLink(shareId, linkId);
        const encryptedLink = await fetchLink(abortSignal, shareId, linkId);

        try {
            const decryptedLink =
                cachedLink && isDecryptedLinkSame(cachedLink.encrypted, encryptedLink)
                    ? undefined
                    : await decryptLink(abortSignal, shareId, encryptedLink);

            linksState.setLinks(shareId, [{ encrypted: encryptedLink, decrypted: decryptedLink }]);

            return linksState.getLink(shareId, linkId)?.decrypted as DecryptedLink;
        } catch (e) {
            if (isIgnoredError(e)) {
                return generateCorruptDecryptedLink(encryptedLink, '�');
            }

            throw new EnrichedError('Failed to decrypt link', {
                tags: {
                    shareId,
                    linkId,
                },
                extra: { e, crypto: true },
            });
        }
    };

    /**
     * loadLinkThumbnail gets thumbnail URL either from cached link or fetches
     * it from API, then downloads the thumbnail block and decrypts it using
     * `downloadCallback`, and finally creates local URL to it which is set to
     * the cached link.
     */
    const loadLinkThumbnail = async (
        abortSignal: AbortSignal,
        shareId: string,
        linkId: string,
        downloadCallback: (
            downloadUrl: string,
            downloadToken: string
        ) => Promise<{ contents: Promise<Uint8Array[]>; verificationStatusPromise: Promise<VERIFICATION_STATUS> }>
    ): Promise<string | undefined> => {
        const link = await getLink(abortSignal, shareId, linkId);
        if (link.cachedThumbnailUrl || !link.hasThumbnail || !link.activeRevision) {
            return link.cachedThumbnailUrl;
        }

        let downloadInfo = {
            isFresh: false,
            downloadUrl: link.activeRevision.thumbnail?.bareUrl,
            downloadToken: link.activeRevision.thumbnail?.token,
        };
        const loadDownloadUrl = async (activeRevisionId: string) => {
            const res = (await debouncedRequest(
                queryFileRevisionThumbnail(shareId, linkId, activeRevisionId)
            )) as DriveFileRevisionThumbnailResult;

            return {
                isFresh: true,
                downloadUrl: res.ThumbnailBareURL,
                downloadToken: res.ThumbnailToken,
            };
        };

        const loadThumbnailUrl = async (downloadUrl: string, downloadToken: string): Promise<string> => {
            const { contents, verificationStatusPromise } = await downloadCallback(downloadUrl, downloadToken);
            const data = await contents;
            const url = URL.createObjectURL(new Blob(data, { type: 'image/jpeg' }));
            linksState.setCachedThumbnail(shareId, linkId, url);

            const cachedLink = linksState.getLink(shareId, linkId);
            if (cachedLink) {
                const verificationStatus = await verificationStatusPromise;
                handleSignatureCheck(shareId, cachedLink.encrypted, 'thumbnail', verificationStatus);
            }

            return url;
        };

        if (!downloadInfo.downloadUrl || !downloadInfo.downloadToken) {
            downloadInfo = await loadDownloadUrl(link.activeRevision.id);
        }

        if (!downloadInfo.downloadUrl || !downloadInfo.downloadToken) {
            return;
        }

        try {
            return await loadThumbnailUrl(downloadInfo.downloadUrl, downloadInfo.downloadToken);
        } catch (err) {
            // Download URL and token can be expired if we used cached version.
            // We get thumbnail info with the link, but if user don't scroll
            // to the item before cached version expires, we need to try again
            // with a loading the new URL and token.
            if (downloadInfo.isFresh) {
                throw err;
            }
            downloadInfo = await loadDownloadUrl(link.activeRevision.id);
            if (!downloadInfo.downloadUrl || !downloadInfo.downloadToken) {
                return;
            }
            return loadThumbnailUrl(downloadInfo.downloadUrl, downloadInfo.downloadToken);
        }
    };

    const setSignatureIssues = async (
        abortSignal: AbortSignal,
        shareId: string,
        linkId: string,
        signatureIssues: SignatureIssues
    ) => {
        const link = await getEncryptedLink(abortSignal, shareId, linkId);
        linksState.setLinks(shareId, [
            {
                encrypted: {
                    ...link,
                    signatureIssues,
                },
            },
        ]);

        const locations = Object.keys(signatureIssues) as SignatureIssueLocation[];
        if (locations.length) {
            // Signature issues can have multiple sources.
            // If the problem comes from NodeKey, its more important,
            // as that is more serious bug than when it comes from
            // user key.
            const hasSignatureIssueForNodeKey = (
                ['hash', 'contentKeyPacket', 'blocks', 'thumbnail', 'manifest'] as SignatureIssueLocation[]
            ).some((location) => locations.includes(location));
            // But if its not due to NodeKey, we take random source
            // of issue, as it doesnt matter that much.
            const location = hasSignatureIssueForNodeKey ? 'hash' : locations[0];

            reportSignatureError(shareId, link, location);
        }
    };

    return {
        getLinkPassphraseAndSessionKey,
        getLinkPrivateKey,
        getLinkSessionKey,
        getLinkHashKey,
        decryptLink,
        getEncryptedLink,
        getLink,
        loadFreshLink,
        loadLinkThumbnail,
        setSignatureIssues,
    };
}
