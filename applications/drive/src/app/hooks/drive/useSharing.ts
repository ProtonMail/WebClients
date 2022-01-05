import { encryptSessionKey, splitMessage, decryptSessionKey, getMessage, SessionKey } from 'pmcrypto';
import { c } from 'ttag';

import { generateKeySaltAndPassphrase } from '@proton/shared/lib/keys/keys';
import { computeKeyPassword } from '@proton/srp';
import { srpGetVerify } from '@proton/shared/lib/srp';
import { base64StringToUint8Array, uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import { getRandomString } from '@proton/shared/lib/helpers/string';
import { chunk } from '@proton/shared/lib/helpers/array';
import { decryptUnsigned, encryptUnsigned } from '@proton/shared/lib/keys/driveKeys';
import runInQueue from '@proton/shared/lib/helpers/runInQueue';
import { textToClipboard, isSafari } from '@proton/shared/lib/helpers/browser';
import { useApi, usePreventLeave, useNotifications } from '@proton/components';
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
    FOLDER_PAGE_SIZE,
    MAX_THREADS_PER_REQUEST,
    RESPONSE_CODE,
    SHARE_GENERATED_PASSWORD_LENGTH,
} from '@proton/shared/lib/drive/constants';
import {
    SharedURLFlags,
    SharedURLSessionKeyPayload,
    ShareURL,
    UpdateSharedURL,
} from '@proton/shared/lib/interfaces/drive/sharing';
import { LinkMeta } from '@proton/shared/lib/interfaces/drive/link';

import { getSharedLink } from '../../utils/link';
import { useDriveCache } from '../../components/DriveCache/DriveCacheProvider';
import useDebouncedRequest from '../util/useDebouncedRequest';
import useDrive from './useDrive';
import useDriveCrypto from './useDriveCrypto';
import { useDriveEventManager } from '../../components/driveEventManager';

function useSharing() {
    const { createNotification } = useNotifications();
    const { getPrimaryAddressKey, getPrimaryAddressKeys } = useDriveCrypto();
    const { createShare, getLinkMeta } = useDrive();
    const cache = useDriveCache();
    const api = useApi();
    const debouncedRequest = useDebouncedRequest();
    const { preventLeave } = usePreventLeave();
    const driveEventManager = useDriveEventManager();

    const encryptSymmetricSessionKey = async (sessionKey: SessionKey, password: string) => {
        const { message } = await encryptSessionKey({
            data: sessionKey.data,
            algorithm: sessionKey.algorithm,
            passwords: [password],
        });
        const {
            symmetric: [bytes],
        } = await splitMessage(message);
        return uint8ArrayToBase64String(bytes);
    };

    const encryptSharedURLPassword = async (password: string) => {
        const {
            address: { Email: CreatorEmail },
            publicKey,
        } = await getPrimaryAddressKey();

        const Password = await encryptUnsigned({
            message: password,
            publicKey,
        });

        return {
            CreatorEmail,
            Password,
        };
    };

    const createSharedLink = async (
        shareId: string,
        volumeId: string,
        linkId: string,
        shareInfo?: { ID: string; sessionKey: SessionKey }
    ): Promise<{
        ShareURL: ShareURL;
        keyInfo: {
            shareSessionKey: SessionKey;
            sharePasswordSalt: string;
        };
    }> => {
        const password = getRandomString(SHARE_GENERATED_PASSWORD_LENGTH);
        const credentials = { password };

        const { ID, sessionKey } = shareInfo
            ? { ID: shareInfo.ID, sessionKey: shareInfo.sessionKey }
            : await createShare(shareId, volumeId, linkId).then(({ Share: { ID }, keyInfo: { sessionKey } }) => ({
                  ID,
                  sessionKey,
              }));

        const getSharedLinkPassphraseAndKeyPacket = async () => {
            const { salt: SharePasswordSalt, passphrase: sharedLinkPassword } = await generateKeySaltAndPassphrase(
                password
            );
            const SharePassphraseKeyPacket = await encryptSymmetricSessionKey(sessionKey, sharedLinkPassword);

            return {
                SharePasswordSalt,
                SharePassphraseKeyPacket,
            };
        };

        const [
            { SharePasswordSalt, SharePassphraseKeyPacket },
            { CreatorEmail, Password },
            {
                Auth: { Salt: UrlPasswordSalt, Verifier: SRPVerifier, ModulusID: SRPModulusID },
            },
        ] = await Promise.all([
            getSharedLinkPassphraseAndKeyPacket(),
            encryptSharedURLPassword(password),
            srpGetVerify({
                api,
                credentials,
            }),
        ]);

        const { ShareURL } = await api(
            queryCreateSharedLink(ID, {
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
        );

        /*
         * We need to update cache with newly created shared link meta.
         * One particular case would be access count for a shared link. While
         * empty link being already added to cache upon opening sharing modal,
         * meta never gets updated.
         */
        cache.set.shareURLs(new Map([[ShareURL.ShareURLID, ShareURL]]), shareId);

        await driveEventManager.pollAllShareEvents(shareId).catch(console.warn);

        return {
            ShareURL: {
                ...ShareURL,
                Password: password,
            },
            keyInfo: {
                shareSessionKey: sessionKey,
                sharePasswordSalt: SharePasswordSalt,
            },
        };
    };

    /*
     * `password` can come in several shapes:
     * - <initial>, flags === 0 – legacy without custom password
     * - <custom>, flags === 1 – legacy custom password
     * - <generated>, flags === 2 – without custom password
     * - <generated><custom>, flags === 3, contains both generated and custom paswords
     * There are four bit array states that can be used as `flags`:
     * - `0` - legacy shared link without custom password.
     * - `1` - legacy shared link with custom password. These shares don't
     *         support password deletion.
     * - `2` - shared link with generated password without custom password.
     * - `3` - shared link with both generated and custom passwords.
     */
    const getSharedLinkUpdatedFlags = (password: string, flags: number) => {
        // If generated password is included and the password is of the length
        // of generated password only, then flag should be just that.
        if (password.length === SHARE_GENERATED_PASSWORD_LENGTH && flags & SharedURLFlags.GeneratedPasswordIncluded) {
            return SharedURLFlags.GeneratedPasswordIncluded;
        }
        // If the share was not legacy one with custom password, we can upgrade
        // it to new share. If the share is already with new flag, it keeps it.
        if ((flags & SharedURLFlags.CustomPassword) === 0 || flags & SharedURLFlags.GeneratedPasswordIncluded) {
            return SharedURLFlags.CustomPassword | SharedURLFlags.GeneratedPasswordIncluded;
        }
        // If the share was legacy with custom password, we need to keep it as
        // is, otherwise links would change due to new logic of gen. password.
        return SharedURLFlags.CustomPassword;
    };

    const getFieldsToUpdateForPassword = async (
        newPassword: string,
        flags: number,
        keyInfo: SharedURLSessionKeyPayload
    ): Promise<Partial<UpdateSharedURL>> => {
        const { sharePasswordSalt, shareSessionKey } = keyInfo;

        const [
            SharePassphraseKeyPacket,
            { Password },
            {
                Auth: { Salt: UrlPasswordSalt, Verifier: SRPVerifier, ModulusID: SRPModulusID },
            },
        ] = await Promise.all([
            computeKeyPassword(newPassword, sharePasswordSalt).then((sharedLinkPassword) =>
                encryptSymmetricSessionKey(shareSessionKey, sharedLinkPassword)
            ),
            encryptSharedURLPassword(newPassword),
            srpGetVerify({
                api,
                credentials: { password: newPassword },
            }),
        ]);

        const fieldsToUpdate: Partial<UpdateSharedURL> = {
            Flags: getSharedLinkUpdatedFlags(newPassword, flags),
            Password,
            SharePassphraseKeyPacket,
            SRPVerifier,
            SRPModulusID,
            UrlPasswordSalt,
        };

        return fieldsToUpdate;
    };

    const updateSharedLink = async (
        shareUrlInfo: {
            shareId: string;
            token: string;
            flags: number;
            keyInfo: SharedURLSessionKeyPayload;
        },
        newDuration?: number | null,
        newPassword?: string
    ) => {
        const { shareId, token, flags, keyInfo } = shareUrlInfo;
        let fieldsToUpdate: Partial<UpdateSharedURL> = {};

        if (newDuration !== undefined) {
            fieldsToUpdate = { ExpirationDuration: newDuration };
        }

        if (newPassword !== undefined) {
            const fieldsToUpdateForPassword = await getFieldsToUpdateForPassword(newPassword, flags, keyInfo);
            fieldsToUpdate = {
                ...fieldsToUpdate,
                ...fieldsToUpdateForPassword,
            };
        }

        const { ShareURL } = await api(queryUpdateSharedLink(shareId, token, fieldsToUpdate));

        // Update password value to decrypted one.
        if (newPassword) {
            fieldsToUpdate.Password = newPassword;
        }

        await driveEventManager.pollAllDriveEvents().catch(console.warn);

        return {
            ...fieldsToUpdate,
            ExpirationTime: ShareURL.ExpirationTime,
        };
    };

    const getSharedURLs = async (sharedURLShareId: string) => {
        const { ShareURLs = [] } = await debouncedRequest<{
            ShareURLs: ShareURL[];
            Links?: { [id: string]: LinkMeta };
        }>(querySharedLinks(sharedURLShareId, { Page: 0, Recursive: 0, PageSize: FOLDER_PAGE_SIZE }));

        return {
            ShareURLs,
        };
    };

    const fetchSharedURLs = async (sharedURLShareId: string, Page = 0, PageSize = FOLDER_PAGE_SIZE) => {
        const { Links = {}, ShareURLs = [] } = await debouncedRequest<{
            ShareURLs: ShareURL[];
            Links?: { [id: string]: LinkMeta };
        }>(querySharedLinks(sharedURLShareId, { Page, Recursive: 1, PageSize }));

        const allSharedLinks = Object.values(Links).filter(({ Shared }) => Shared);
        const sharedLinks = ShareURLs.map(
            ({ ShareID }) => allSharedLinks.find(({ ShareIDs }) => ShareIDs.includes(ShareID))!
        );

        const decryptedLinks = await Promise.all(
            sharedLinks.map((meta) =>
                getLinkMeta(sharedURLShareId, meta.LinkID, {
                    fetchLinkMeta: async (id) => Links[id],
                    preventRerenders: true,
                })
            )
        );

        cache.set.sharedLinkMetas(
            decryptedLinks,
            sharedURLShareId,
            decryptedLinks.length < PageSize ? 'complete' : 'incremental'
        );

        cache.set.shareURLs(new Map(ShareURLs.map((shareURL) => [shareURL.ShareURLID, shareURL])), sharedURLShareId);

        return {
            ShareURLs,
            metas: decryptedLinks,
        };
    };

    const fetchNextPage = async (sharedURLShareId: string) => {
        const loadedItems = cache.get.sharedLinks(sharedURLShareId) || [];
        const PageSize = FOLDER_PAGE_SIZE;
        const Page = Math.floor(loadedItems.length / PageSize);

        await fetchSharedURLs(sharedURLShareId, Page, PageSize);
    };

    const decryptShareSessionKey = async (keyPacket: string | Uint8Array, password: string) => {
        return decryptSessionKey({ message: await getMessage(keyPacket), passwords: [password] });
    };

    const decryptSharedLink = async ({ Password, SharePassphraseKeyPacket, SharePasswordSalt, ...rest }: ShareURL) => {
        const privateKeys = (await getPrimaryAddressKeys()).map(({ privateKey }) => privateKey);
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

    const deleteSharedLink = async (sharedURLShareId: string, token: string) => {
        const res = api(queryDeleteSharedLink(sharedURLShareId, token));
        await driveEventManager.pollAllDriveEvents().catch(console.warn);
        return res;
    };

    const deleteMultipleSharedLinks = async (shareId: string, sharedUrlIds: string[]) => {
        const batches = chunk(sharedUrlIds, BATCH_REQUEST_SIZE);

        const deleteSharedQueue = batches.map(
            (batch) => () =>
                debouncedRequest<{ Responses: { ShareURLID: string; Response: { Code: number } }[] }>(
                    queryDeleteMultipleSharedLinks(shareId, batch)
                ).then(({ Responses }) =>
                    Responses.filter((res) => res.Response.Code === RESPONSE_CODE.SUCCESS).map(
                        ({ ShareURLID }) => ShareURLID
                    )
                )
        );

        const deletedIds = await preventLeave(runInQueue(deleteSharedQueue, MAX_THREADS_PER_REQUEST));
        await driveEventManager.pollAllShareEvents(shareId);
        return ([] as string[]).concat(...deletedIds);
    };

    // Safari does not allow copy to clipboard outside of the event
    // (e.g., click). No await or anything does not do the trick.
    // Clipboard API also doesn't work. Therefore we cannot have this
    // feature on Safari at this moment.
    const copyShareLinkToClipboard = isSafari()
        ? undefined
        : async (shareId: string) => {
              return getSharedURLs(shareId)
                  .then(({ ShareURLs: [sharedUrl] }) => {
                      return decryptSharedLink(sharedUrl);
                  })
                  .then(({ ShareURL }) => {
                      const url = getSharedLink(ShareURL);
                      if (url) {
                          textToClipboard(url);
                          createNotification({
                              text: c('Info').t`Link copied to clipboard`,
                          });
                      }
                  })
                  .catch((err: any) => {
                      console.error(err);
                      createNotification({
                          type: 'error',
                          text: c('Error').t`Failed to load the link`,
                      });
                  });
          };

    return {
        updateSharedLink,
        decryptSharedLink,
        createSharedLink,
        getSharedURLs,
        deleteSharedLink,
        fetchNextPage,
        deleteMultipleSharedLinks,
        copyShareLinkToClipboard,
    };
}

export default useSharing;
