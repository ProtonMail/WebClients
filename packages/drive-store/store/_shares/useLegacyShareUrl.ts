import { useApi, usePreventLeave } from '@proton/components';
import type { SessionKey } from '@proton/crypto';
import { CryptoProxy } from '@proton/crypto';
import { encodeUtf8 } from '@proton/crypto/lib/utils';
import {
    queryCreateSharedLink,
    queryDeleteMultipleSharedLinks,
    queryDeleteSharedLink,
    querySharedLinks,
    queryUpdateSharedLink,
} from '@proton/shared/lib/api/drive/sharing';
import {
    BATCH_REQUEST_SIZE,
    DEFAULT_SHARE_MAX_ACCESSES,
    MAX_THREADS_PER_REQUEST,
    RESPONSE_CODE,
    SHARE_GENERATED_PASSWORD_LENGTH,
} from '@proton/shared/lib/drive/constants';
import {
    base64StringToUint8Array,
    stringToUint8Array,
    uint8ArrayToBase64String,
} from '@proton/shared/lib/helpers/encoding';
import runInQueue from '@proton/shared/lib/helpers/runInQueue';
import type {
    ShareURL as ShareURLPayload,
    SharedURLSessionKeyPayload,
} from '@proton/shared/lib/interfaces/drive/sharing';
import { SharedURLFlags } from '@proton/shared/lib/interfaces/drive/sharing';
import { decryptUnsigned, encryptUnsigned } from '@proton/shared/lib/keys/driveKeys';
import { generateKeySaltAndPassphrase } from '@proton/shared/lib/keys/keys';
import { srpGetVerify } from '@proton/shared/lib/srp';
import { computeKeyPassword } from '@proton/srp';
import chunk from '@proton/utils/chunk';
import getRandomString from '@proton/utils/getRandomString';
import groupWith from '@proton/utils/groupWith';
import isTruthy from '@proton/utils/isTruthy';
import unique from '@proton/utils/unique';

import { sendErrorReport } from '../../utils/errorHandling';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { shareUrlPayloadToShareUrl, shareUrlPayloadToShareUrlLEGACY, useDebouncedRequest } from '../_api';
import { useDriveCrypto } from '../_crypto';
import { useDriveEventManager } from '../_events';
import { useLink } from '../_links';
import { useVolumesState } from '../_volumes';
import type { ShareURLLEGACY, UpdateSharedURL } from './interface';
import { getSharedLink } from './shareUrl';
import useShare from './useShare';
import useShareActions from './useShareActions';

/**
 * useShareUrl provides actions to manipulate with share URLs.
 *
 * This file needs a bit of love. First, lets transform ShareURL to nicer
 * interface and compute some flags so we don't need to use shareUrl helpers.
 * Second, lets separate it into two layers similarly as links are: this
 * module handles only communication with API for the needs of the web client
 * and lets have another layer in actions folder to wrap it with error
 * reporting and generating user messages. Third, lets remove notifications
 * and other business logic from the ShareLinkModal. Fourth, cover with tests!
 */
export default function useLegacyShareUrl() {
    const api = useApi();
    const { preventLeave } = usePreventLeave();
    const debouncedRequest = useDebouncedRequest();
    const driveCrypto = useDriveCrypto();
    const events = useDriveEventManager();
    const { createShare, deleteShare } = useShareActions();
    const { getShare, getShareWithKey, getShareSessionKey } = useShare();
    const { getLink, loadFreshLink, getLinkPrivateKey } = useLink();
    const volumeState = useVolumesState();

    const fetchShareUrl = async (abortSignal: AbortSignal, shareId: string): Promise<ShareURLLEGACY | undefined> => {
        const { ShareURLs = [] } = await debouncedRequest<{
            ShareURLs: ShareURLPayload[];
        }>(querySharedLinks(shareId, { Page: 0, Recursive: 0, PageSize: 10 }), abortSignal);

        return ShareURLs.length ? shareUrlPayloadToShareUrlLEGACY(ShareURLs[0]) : undefined;
    };

    const decryptShareSessionKey = async (keyPacket: string | Uint8Array<ArrayBuffer>, password: string) => {
        const messageType = keyPacket instanceof Uint8Array ? 'binaryMessage' : 'armoredMessage';
        return CryptoProxy.decryptSessionKey({ [messageType]: keyPacket, passwords: [password] });
    };

    const decryptShareUrl = async (
        abortSignal: AbortSignal,
        { creatorEmail, shareId, password, sharePassphraseKeyPacket, sharePasswordSalt, ...rest }: ShareURLLEGACY
    ) => {
        const share = await getShareWithKey(abortSignal, shareId);
        const privateKeys = await driveCrypto.getPrivateAddressKeys(share.addressId);
        const decryptedPassword = await decryptUnsigned({
            armoredMessage: password,
            privateKey: privateKeys,
        }).catch((e) =>
            Promise.reject(
                new EnrichedError('Failed to decrypt share URL password', {
                    tags: {
                        shareId,
                    },
                    extra: {
                        e,
                        keyIds: privateKeys.reduce(
                            (acc, key) => ({
                                ...acc,
                                [key.getKeyID()]: key.subkeys.map((subkey) => subkey.getKeyID()),
                            }),
                            {}
                        ),
                    },
                })
            )
        );

        const sharedLinkPassword: string = await computeKeyPassword(decryptedPassword, sharePasswordSalt);
        const shareSessionKey = await decryptShareSessionKey(
            base64StringToUint8Array(sharePassphraseKeyPacket),
            sharedLinkPassword
        ).catch((e) =>
            Promise.reject(
                new EnrichedError('Failed to decrypt share session key for shared URL', {
                    tags: {
                        shareId,
                    },
                    extra: { e },
                })
            )
        );

        if (!shareSessionKey) {
            throw new EnrichedError('Failed to decrypt share session key for shared URL', {
                tags: {
                    shareId,
                },
            });
        }

        return {
            shareUrl: {
                ...rest,
                shareId,
                creatorEmail,
                password: decryptedPassword,
                sharePassphraseKeyPacket,
                sharePasswordSalt,
            },
            keyInfo: {
                sharePasswordSalt,
                shareSessionKey,
            },
        };
    };

    const encryptSymmetricSessionKey = async (sessionKey: SessionKey, password: string) => {
        const symmetric = await CryptoProxy.encryptSessionKey({
            data: sessionKey.data,
            algorithm: sessionKey.algorithm,
            passwords: [password],
            format: 'binary',
        });

        return uint8ArrayToBase64String(symmetric);
    };

    const encryptShareUrlPassword = async (decryptedPassword: string, addressId: string) => {
        const {
            address: { Email: email },
            publicKey,
        } = await driveCrypto.getOwnAddressAndPrimaryKeys(addressId);
        const password = await encryptUnsigned({
            message: stringToUint8Array(encodeUtf8(decryptedPassword)),
            publicKey,
        });

        return { email, password };
    };

    const createShareUrl = async (
        abortSignal: AbortSignal,
        shareId: string,
        linkShareId: string,
        linkShareSessionKey: SessionKey
    ): Promise<{
        shareUrl: ShareURLLEGACY;
        keyInfo: {
            shareSessionKey: SessionKey;
            sharePasswordSalt: string;
        };
    }> => {
        const password = getRandomString(SHARE_GENERATED_PASSWORD_LENGTH);
        const credentials = { password };

        const getSharedLinkPassphraseSaltAndKeyPacket = async () => {
            const { salt, passphrase } = await generateKeySaltAndPassphrase(password);
            const keyPacket = await encryptSymmetricSessionKey(linkShareSessionKey, passphrase);

            return { salt, keyPacket };
        };

        const share = await getShareWithKey(abortSignal, shareId);

        const [
            { salt: SharePasswordSalt, keyPacket: SharePassphraseKeyPacket },
            { email: CreatorEmail, password: Password },
            {
                Auth: { Salt: UrlPasswordSalt, Verifier: SRPVerifier, ModulusID: SRPModulusID },
            },
        ] = await Promise.all([
            getSharedLinkPassphraseSaltAndKeyPacket().catch((e) =>
                Promise.reject(
                    new EnrichedError('Failed to encrypt share URL session key', {
                        tags: {
                            shareId,
                            linkShareId,
                        },
                        extra: { e },
                    })
                )
            ),
            encryptShareUrlPassword(password, share.addressId).catch((e) =>
                Promise.reject(
                    new EnrichedError('Failed to encrypt share URL password', {
                        tags: {
                            shareId,
                            linkShareId,
                        },
                        extra: { e },
                    })
                )
            ),
            srpGetVerify({
                api,
                credentials,
            }),
        ]);

        const shareUrl = await preventLeave(
            debouncedRequest<{ ShareURL: ShareURLPayload }>(
                queryCreateSharedLink(linkShareId, {
                    Flags: SharedURLFlags.GeneratedPasswordIncluded,
                    Permissions: 4,
                    MaxAccesses: DEFAULT_SHARE_MAX_ACCESSES,
                    CreatorEmail,
                    ExpirationDuration: null,
                    SharePassphraseKeyPacket,
                    SRPModulusID,
                    SRPVerifier,
                    SharePasswordSalt,
                    UrlPasswordSalt,
                    Password,
                })
            )
        ).then(({ ShareURL }) => shareUrlPayloadToShareUrlLEGACY(ShareURL));

        const volumeId = volumeState.findVolumeId(shareId);
        if (volumeId) {
            await events.pollEvents.volumes(volumeId);
        }

        return {
            shareUrl: {
                ...shareUrl,
                password,
            },
            keyInfo: {
                shareSessionKey: linkShareSessionKey,
                sharePasswordSalt: SharePasswordSalt,
            },
        };
    };

    const loadOrCreateShareUrl = async (
        abortSignal: AbortSignal,
        shareId: string,
        linkId: string
    ): Promise<{
        shareUrl: ShareURLLEGACY;
        keyInfo: {
            shareSessionKey: SessionKey;
            sharePasswordSalt: string;
        };
    }> => {
        const [share, link] = await Promise.all([
            getShare(abortSignal, shareId),
            loadFreshLink(abortSignal, shareId, linkId),
        ]);

        if (!link.parentLinkId) {
            throw Error('Root folder cannot be shared');
        }

        const { shareId: linkShareId, sessionKey: linkShareSessionKey } = link.shareId
            ? await (async () => {
                  const linkPrivateKey = await getLinkPrivateKey(abortSignal, shareId, linkId);
                  return {
                      shareId: link.shareId!,
                      sessionKey: await getShareSessionKey(abortSignal, link.shareId!, linkPrivateKey),
                  };
              })()
            : await createShare(abortSignal, shareId, share.volumeId, linkId);

        const shareUrl = await fetchShareUrl(abortSignal, linkShareId);
        if (shareUrl) {
            return decryptShareUrl(abortSignal, shareUrl);
        }
        return createShareUrl(abortSignal, shareId, linkShareId, linkShareSessionKey).catch((err) => {
            // If share URL creation was aborted, remove its share as well
            // as at this moment we support only sharing via link.
            if (abortSignal.aborted) {
                void deleteShare(linkShareId);
            }
            throw err;
        });
    };

    const loadShareUrl = async (
        abortSignal: AbortSignal,
        shareId: string,
        linkId: string
    ): Promise<ShareURLLEGACY | undefined> => {
        const link = await loadFreshLink(abortSignal, shareId, linkId);
        if (!link.shareId || !link.shareUrl) {
            return;
        }

        const shareUrl = await fetchShareUrl(abortSignal, link.shareId);
        if (!shareUrl) {
            return;
        }

        const { shareUrl: decryptedShareUrl } = await decryptShareUrl(abortSignal, shareUrl);
        return decryptedShareUrl;
    };

    const loadShareUrlLink = async (
        abortSignal: AbortSignal,
        shareId: string,
        linkId: string
    ): Promise<string | undefined> => {
        const shareUrl = await loadShareUrl(abortSignal, shareId, linkId);
        return getSharedLink(shareUrl);
    };

    const loadShareUrlNumberOfAccesses = async (
        abortSignal: AbortSignal,
        shareId: string,
        linkId: string
    ): Promise<number | undefined> => {
        const shareUrl = await loadShareUrl(abortSignal, shareId, linkId);
        return shareUrl?.numAccesses;
    };

    /*
     * `password` can come in several shapes:
     * - <initial>, flags === 0 – legacy without custom password
     * - <custom>, flags === 1 – legacy custom password
     * - <generated>, flags === 2 – without custom password
     * - <generated><custom>, flags === 3, contains both generated and custom paswords
     * There are four bit array states that can be used as `flags`:
     * - `0` - legacy shared link without custom password.
     * - `1` - legacy shared link with custom password.
     * - `2` - shared link with generated password without custom password.
     * - `3` - shared link with both generated and custom passwords.
     * The legacy shared links are not supported anymore and cannot be modified
     * anymore (user needs to delete them and share links again), so we can
     * ignore such cases and focus only on new flags.
     */
    const getSharedLinkUpdatedFlags = (password: string) => {
        if (password.length === SHARE_GENERATED_PASSWORD_LENGTH) {
            return SharedURLFlags.GeneratedPasswordIncluded;
        }
        return SharedURLFlags.CustomPassword | SharedURLFlags.GeneratedPasswordIncluded;
    };

    const getFieldsToUpdateForPassword = async (
        newPassword: string,
        addressId: string,
        _flags: number,
        keyInfo: SharedURLSessionKeyPayload
    ): Promise<Partial<UpdateSharedURL>> => {
        const { sharePasswordSalt, shareSessionKey } = keyInfo;

        const [
            sharePassphraseKeyPacket,
            { password },
            {
                Auth: { Salt: urlPasswordSalt, Verifier: srpVerifier, ModulusID: srpModulusID },
            },
        ] = await Promise.all([
            computeKeyPassword(newPassword, sharePasswordSalt)
                .then((sharedLinkPassword) => encryptSymmetricSessionKey(shareSessionKey, sharedLinkPassword))
                .catch((e) =>
                    Promise.reject(
                        new EnrichedError('Failed to encrypt share URL session key', {
                            extra: { e },
                        })
                    )
                ),
            encryptShareUrlPassword(newPassword, addressId).catch((e) =>
                Promise.reject(
                    new EnrichedError('Failed to encrypt share URL password', {
                        extra: { e },
                    })
                )
            ),
            srpGetVerify({
                api,
                credentials: { password: newPassword },
            }),
        ]);

        const fieldsToUpdate: Partial<UpdateSharedURL> = {
            flags: getSharedLinkUpdatedFlags(newPassword),
            password,
            sharePassphraseKeyPacket,
            srpVerifier,
            srpModulusID,
            urlPasswordSalt,
        };
        return fieldsToUpdate;
    };

    const updateShareUrl = async (
        abortSignal: AbortSignal,
        shareUrlInfo: {
            shareId: string;
            shareUrlId: string;
            flags: number;
            keyInfo: SharedURLSessionKeyPayload;
        },
        newDuration?: number | null,
        newPassword?: string
    ) => {
        const { shareId, shareUrlId, flags, keyInfo } = shareUrlInfo;
        let fieldsToUpdate: Partial<UpdateSharedURL> = {};

        if (newDuration !== undefined) {
            fieldsToUpdate = { expirationDuration: newDuration };
        }

        if (newPassword !== undefined) {
            const share = await getShareWithKey(abortSignal, shareId);
            const fieldsToUpdateForPassword = await getFieldsToUpdateForPassword(
                newPassword,
                share.addressId,
                flags,
                keyInfo
            ).catch((e) =>
                Promise.reject(
                    new EnrichedError('Failed to update share URL password', {
                        tags: {
                            shareId,
                            shareUrlId,
                        },
                        extra: { e },
                    })
                )
            );

            fieldsToUpdate = {
                ...fieldsToUpdate,
                ...fieldsToUpdateForPassword,
            };
        }

        const shareUrl = await preventLeave(
            debouncedRequest<{ ShareURL: ShareURLPayload }>(
                queryUpdateSharedLink(shareId, shareUrlId, {
                    SharePasswordSalt: fieldsToUpdate.sharePasswordSalt,
                    SharePassphraseKeyPacket: fieldsToUpdate.sharePassphraseKeyPacket,
                    Permissions: fieldsToUpdate.permissions,
                    Password: fieldsToUpdate.password,
                    MaxAccesses: fieldsToUpdate.maxAccesses,
                    Flags: fieldsToUpdate.flags,
                    ExpirationDuration: fieldsToUpdate.expirationDuration,
                    ExpirationTime: fieldsToUpdate.expirationTime,
                    SRPModulusID: fieldsToUpdate.srpModulusID,
                    SRPVerifier: fieldsToUpdate.srpVerifier,
                    UrlPasswordSalt: fieldsToUpdate.urlPasswordSalt,
                })
            )
        ).then(({ ShareURL }) => shareUrlPayloadToShareUrl(ShareURL));

        // Update password value to decrypted one.
        if (newPassword) {
            fieldsToUpdate.password = newPassword;
        }

        await events.pollEvents.driveEvents();

        return {
            ...fieldsToUpdate,
            expirationTime: shareUrl.expirationTime,
        };
    };

    const deleteShareUrl = async (shareId: string, shareUrlId: string) => {
        const deletePromise = async () => {
            await debouncedRequest(queryDeleteSharedLink(shareId, shareUrlId)).catch((error) => {
                sendErrorReport(error);
                throw error;
            });
            // Lets only collect reports when share cannot be deleted but do
            // not bother users about it - link was deleted fine.
            await deleteShare(shareId).catch(sendErrorReport);
        };
        await preventLeave(deletePromise());
        await events.pollEvents.driveEvents();
    };

    const deleteShareUrls = async (abortSignal: AbortSignal, ids: { linkId: string; shareId: string }[]) => {
        const links = await Promise.all(ids.map(({ linkId, shareId }) => getLink(abortSignal, shareId, linkId)));

        const successes: string[] = [];
        const failures: { [linkId: string]: any } = {};

        // First delete urls in batches so the request is of reasonable size.
        const sharedLinks = links
            .map(({ linkId, shareUrl, rootShareId }) => ({ linkId, rootShareId, shareUrlId: shareUrl?.id }))
            .filter(({ shareUrlId }) => shareUrlId) as { linkId: string; shareUrlId: string; rootShareId: string }[];
        const groupedLinksByShareId = groupWith((a, b) => a.rootShareId === b.rootShareId, sharedLinks);

        const batches: (typeof sharedLinks)[] = [];

        groupedLinksByShareId.forEach((linkGroup) => {
            if (linkGroup.length <= BATCH_REQUEST_SIZE) {
                batches.push(linkGroup);
                return;
            }

            batches.push(...chunk(sharedLinks, BATCH_REQUEST_SIZE));
        });

        const deleteShareUrlQueue = batches.map(
            (batchLinks) => () =>
                debouncedRequest<{ Responses: { ShareURLID: string; Response: { Code: number } }[] }>(
                    queryDeleteMultipleSharedLinks(
                        batchLinks[0].rootShareId,
                        batchLinks.map(({ shareUrlId }) => shareUrlId)
                    )
                )
                    .then(({ Responses }) =>
                        Responses.forEach(({ Response }, index) => {
                            const linkId = batchLinks[index].linkId;
                            if (Response.Code === RESPONSE_CODE.SUCCESS) {
                                successes.push(linkId);
                            } else {
                                failures[linkId] = Response.Code;
                            }
                        })
                    )
                    .catch((error) => {
                        batchLinks.forEach(({ linkId }) => (failures[linkId] = error));
                    })
        );
        await preventLeave(runInQueue(deleteShareUrlQueue, MAX_THREADS_PER_REQUEST));

        // Once we know how many urls we deleted, we can delete shares itself.
        // Note this needs to be changed once we support sharing between members.
        const sharedIds = [...new Set(links.map(({ shareId }) => shareId).filter(isTruthy))];
        const deleteShareQueue = sharedIds.map((shareId) => async () => {
            // Lets only collect reports when share cannot be deleted but do
            // not bother users about it - link was deleted fine.
            await deleteShare(shareId).catch(sendErrorReport);
        });
        await preventLeave(runInQueue(deleteShareQueue, MAX_THREADS_PER_REQUEST));

        const shareIdsToUpdate = unique(batches.map((batch) => batch[0].rootShareId));

        const volumeIds = unique(
            shareIdsToUpdate.map((shareId) => {
                return volumeState.findVolumeId(shareId);
            })
        ).filter(isTruthy);

        if (volumeIds.length) {
            await events.pollEvents.volumes(volumeIds);
        }

        return { successes, failures };
    };

    return {
        // This is a bit of hack to nicely report all errors. It might collect
        // a bit more errors than we need and it might not result in proper
        // error message to user. See comment to useShareUrl on the top.
        loadOrCreateShareUrl: (abortSignal: AbortSignal, shareId: string, linkId: string) =>
            loadOrCreateShareUrl(abortSignal, shareId, linkId).catch((error) => {
                sendErrorReport(error);
                throw error;
            }),
        loadShareUrlLink,
        loadShareUrlNumberOfAccesses,
        updateShareUrl: (
            abortSignal: AbortSignal,
            shareUrlInfo: {
                shareId: string;
                shareUrlId: string;
                flags: number;
                keyInfo: SharedURLSessionKeyPayload;
            },
            newDuration?: number | null,
            newPassword?: string
        ) =>
            updateShareUrl(abortSignal, shareUrlInfo, newDuration, newPassword).catch((error) => {
                sendErrorReport(error);
                throw error;
            }),
        deleteShareUrl,
        deleteShareUrls,
    };
}
