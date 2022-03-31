import { CryptoProxy, SessionKey } from '@proton/crypto';
import { encodeUtf8 } from '@proton/crypto/lib/utils';
import { useApi, usePreventLeave } from '@proton/components';
import { computeKeyPassword } from '@proton/srp';
import { srpGetVerify } from '@proton/shared/lib/srp';
import chunk from '@proton/utils/chunk';
import {
    base64StringToUint8Array,
    uint8ArrayToBase64String,
    stringToUint8Array,
} from '@proton/shared/lib/helpers/encoding';
import isTruthy from '@proton/utils/isTruthy';
import runInQueue from '@proton/shared/lib/helpers/runInQueue';
import getRandomString from '@proton/utils/getRandomString';
import { generateKeySaltAndPassphrase } from '@proton/shared/lib/keys/keys';
import { decryptUnsigned, encryptUnsigned } from '@proton/shared/lib/keys/driveKeys';
import {
    SharedURLFlags,
    SharedURLSessionKeyPayload,
    ShareURL,
    UpdateSharedURL,
} from '@proton/shared/lib/interfaces/drive/sharing';
import {
    queryCreateSharedLink,
    querySharedLinks,
    queryUpdateSharedLink,
    queryDeleteSharedLink,
    queryDeleteMultipleSharedLinks,
} from '@proton/shared/lib/api/drive/sharing';
import {
    BATCH_REQUEST_SIZE,
    DEFAULT_SHARE_MAX_ACCESSES,
    MAX_THREADS_PER_REQUEST,
    RESPONSE_CODE,
    SHARE_GENERATED_PASSWORD_LENGTH,
} from '@proton/shared/lib/drive/constants';

import { useDebouncedRequest } from '../_api';
import { useDriveCrypto } from '../_crypto';
import { useDriveEventManager } from '../_events';
import { useLink } from '../_links';
import { reportError } from '../_utils';
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
export default function useShareUrl() {
    const api = useApi();
    const { preventLeave } = usePreventLeave();
    const debouncedRequest = useDebouncedRequest();
    const driveCrypto = useDriveCrypto();
    const events = useDriveEventManager();
    const { createShare, deleteShare } = useShareActions();
    const { getShare, getShareSessionKey } = useShare();
    const { getLink, loadFreshLink } = useLink();

    const fetchShareUrl = async (abortSignal: AbortSignal, shareId: string): Promise<ShareURL | undefined> => {
        const { ShareURLs = [] } = await debouncedRequest<{
            ShareURLs: ShareURL[];
        }>(querySharedLinks(shareId, { Page: 0, Recursive: 0, PageSize: 10 }), abortSignal);

        return ShareURLs.length ? ShareURLs[0] : undefined;
    };

    const decryptShareSessionKey = async (keyPacket: string | Uint8Array, password: string) => {
        const messageType = keyPacket instanceof Uint8Array ? 'binaryMessage' : 'armoredMessage';
        return CryptoProxy.decryptSessionKey({ [messageType]: keyPacket, passwords: [password] });
    };

    const decryptShareUrl = async ({
        CreatorEmail,
        Password,
        SharePassphraseKeyPacket,
        SharePasswordSalt,
        ...rest
    }: ShareURL) => {
        const privateKeys = await driveCrypto.getPrivateAddressKeys(CreatorEmail);
        const decryptedPassword = await decryptUnsigned({
            armoredMessage: Password,
            privateKey: privateKeys,
        });

        const sharedLinkPassword: string = await computeKeyPassword(decryptedPassword, SharePasswordSalt);
        const shareSessionKey = await decryptShareSessionKey(
            base64StringToUint8Array(SharePassphraseKeyPacket),
            sharedLinkPassword
        );

        if (!shareSessionKey) {
            throw new Error('Failed to decrypt share session key');
        }

        return {
            ShareURL: {
                ...rest,
                CreatorEmail,
                Password: decryptedPassword,
                SharePassphraseKeyPacket,
                SharePasswordSalt,
            },
            keyInfo: {
                sharePasswordSalt: SharePasswordSalt,
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

    const encryptShareUrlPassword = async (decryptedPassword: string) => {
        const {
            address: { Email: email },
            publicKey,
        } = await driveCrypto.getPrimaryAddressKey();
        const password = await encryptUnsigned({
            message: stringToUint8Array(encodeUtf8(decryptedPassword)),
            publicKey,
        });
        return {
            email,
            password,
        };
    };

    const reencryptShareUrlPassword = async (decryptedPassword: string, creatorEmail: string) => {
        const { publicKey } = await driveCrypto.getPrivatePrimaryAddressKeys(creatorEmail);
        const password = await encryptUnsigned({
            message: stringToUint8Array(encodeUtf8(decryptedPassword)),
            publicKey,
        });
        return password;
    };

    const createShareUrl = async (
        abortSignal: AbortSignal,
        shareId: string,
        linkShareId: string,
        linkShareSessionKey: SessionKey
    ): Promise<{
        ShareURL: ShareURL;
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

        const [
            { salt: SharePasswordSalt, keyPacket: SharePassphraseKeyPacket },
            { email: CreatorEmail, password: Password },
            {
                Auth: { Salt: UrlPasswordSalt, Verifier: SRPVerifier, ModulusID: SRPModulusID },
            },
        ] = await Promise.all([
            getSharedLinkPassphraseSaltAndKeyPacket(),
            encryptShareUrlPassword(password),
            srpGetVerify({
                api,
                credentials,
            }),
        ]);

        const { ShareURL } = await preventLeave(
            debouncedRequest<{ ShareURL: ShareURL }>(
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
        );

        await events.pollShare(shareId);

        return {
            ShareURL: {
                ...ShareURL,
                Password: password,
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
        ShareURL: ShareURL;
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
            ? { shareId: link.shareId, sessionKey: await getShareSessionKey(abortSignal, link.shareId) }
            : await createShare(abortSignal, shareId, share.volumeId, linkId);

        const shareUrl = await fetchShareUrl(abortSignal, linkShareId);
        if (shareUrl) {
            return decryptShareUrl(shareUrl);
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
    ): Promise<ShareURL | undefined> => {
        const link = await loadFreshLink(abortSignal, shareId, linkId);
        if (!link.shareId || !link.shareUrl) {
            return;
        }

        const shareUrl = await fetchShareUrl(abortSignal, link.shareId);
        if (!shareUrl) {
            return;
        }

        const { ShareURL } = await decryptShareUrl(shareUrl);
        return ShareURL;
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
        return shareUrl?.NumAccesses;
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
        creatorEmail: string,
        flags: number,
        keyInfo: SharedURLSessionKeyPayload
    ): Promise<Partial<UpdateSharedURL>> => {
        const { sharePasswordSalt, shareSessionKey } = keyInfo;

        const [
            SharePassphraseKeyPacket,
            Password,
            {
                Auth: { Salt: UrlPasswordSalt, Verifier: SRPVerifier, ModulusID: SRPModulusID },
            },
        ] = await Promise.all([
            computeKeyPassword(newPassword, sharePasswordSalt).then((sharedLinkPassword) =>
                encryptSymmetricSessionKey(shareSessionKey, sharedLinkPassword)
            ),
            reencryptShareUrlPassword(newPassword, creatorEmail),
            srpGetVerify({
                api,
                credentials: { password: newPassword },
            }),
        ]);

        const fieldsToUpdate: Partial<UpdateSharedURL> = {
            Flags: getSharedLinkUpdatedFlags(newPassword),
            Password,
            SharePassphraseKeyPacket,
            SRPVerifier,
            SRPModulusID,
            UrlPasswordSalt,
        };
        return fieldsToUpdate;
    };

    const updateShareUrl = async (
        shareUrlInfo: {
            creatorEmail: string;
            shareId: string;
            shareUrlId: string;
            flags: number;
            keyInfo: SharedURLSessionKeyPayload;
        },
        newDuration?: number | null,
        newPassword?: string
    ) => {
        const { creatorEmail, shareId, shareUrlId, flags, keyInfo } = shareUrlInfo;
        let fieldsToUpdate: Partial<UpdateSharedURL> = {};

        if (newDuration !== undefined) {
            fieldsToUpdate = { ExpirationDuration: newDuration };
        }

        if (newPassword !== undefined) {
            const fieldsToUpdateForPassword = await getFieldsToUpdateForPassword(
                newPassword,
                creatorEmail,
                flags,
                keyInfo
            );
            fieldsToUpdate = {
                ...fieldsToUpdate,
                ...fieldsToUpdateForPassword,
            };
        }

        const { ShareURL } = await preventLeave(
            debouncedRequest<{ ShareURL: ShareURL }>(queryUpdateSharedLink(shareId, shareUrlId, fieldsToUpdate))
        );

        // Update password value to decrypted one.
        if (newPassword) {
            fieldsToUpdate.Password = newPassword;
        }

        await events.pollAllDriveEvents();

        return {
            ...fieldsToUpdate,
            ExpirationTime: ShareURL.ExpirationTime,
        };
    };

    const deleteShareUrl = async (shareId: string, shareUrlId: string) => {
        const deletePromise = async () => {
            await debouncedRequest(queryDeleteSharedLink(shareId, shareUrlId)).catch((error) => {
                reportError(error);
                throw error;
            });
            // Lets only collect reports when share cannot be deleted but do
            // not bother users about it - link was deleted fine.
            await deleteShare(shareId).catch(reportError);
        };
        await preventLeave(deletePromise());
        await events.pollAllDriveEvents();
    };

    const deleteShareUrls = async (abortSignal: AbortSignal, shareId: string, linkIds: string[]) => {
        const links = await Promise.all(linkIds.map((linkId) => getLink(abortSignal, shareId, linkId)));

        const successes: string[] = [];
        const failures: { [linkId: string]: any } = {};

        // First delete urls in batches so the request is of reasonable size.
        // If we delete shares first, API automatically deletes also urls.
        const sharedLinks = links
            .map(({ linkId, shareUrl }) => ({ linkId, shareUrlId: shareUrl?.id }))
            .filter(({ shareUrlId }) => shareUrlId) as { linkId: string; shareUrlId: string }[];
        const batches = chunk(sharedLinks, BATCH_REQUEST_SIZE);
        const deleteShareUrlQueue = batches.map(
            (batchLinks) => () =>
                debouncedRequest<{ Responses: { ShareURLID: string; Response: { Code: number } }[] }>(
                    queryDeleteMultipleSharedLinks(
                        shareId,
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
            await deleteShare(shareId).catch(reportError);
        });
        await preventLeave(runInQueue(deleteShareQueue, MAX_THREADS_PER_REQUEST));

        await events.pollAllShareEvents(shareId);
        return { successes, failures };
    };

    return {
        // This is a bit of hack to nicely report all errors. It might collect
        // a bit more errors than we need and it might not result in proper
        // error message to user. See comment to useShareUrl on the top.
        loadOrCreateShareUrl: (abortSignal: AbortSignal, shareId: string, linkId: string) =>
            loadOrCreateShareUrl(abortSignal, shareId, linkId).catch((error) => {
                reportError(error);
                throw error;
            }),
        loadShareUrlLink,
        loadShareUrlNumberOfAccesses,
        updateShareUrl: (
            shareUrlInfo: {
                creatorEmail: string;
                shareId: string;
                shareUrlId: string;
                flags: number;
                keyInfo: SharedURLSessionKeyPayload;
            },
            newDuration?: number | null,
            newPassword?: string
        ) =>
            updateShareUrl(shareUrlInfo, newDuration, newPassword).catch((error) => {
                reportError(error);
                throw error;
            }),
        deleteShareUrl,
        deleteShareUrls,
    };
}
