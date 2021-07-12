import { generateKeySaltAndPassphrase } from '@proton/shared/lib/keys/keys';
import { encryptSessionKey, splitMessage, decryptSessionKey, getMessage, SessionKey } from 'pmcrypto';
import { computeKeyPassword } from '@proton/srp';
import { srpGetVerify } from '@proton/shared/lib/srp';
import { base64StringToUint8Array, uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import { chunk } from '@proton/shared/lib/helpers/array';
import { decryptUnsigned, encryptUnsigned } from '@proton/shared/lib/keys/driveKeys';
import runInQueue from '@proton/shared/lib/helpers/runInQueue';
import { useApi, usePreventLeave } from '@proton/components';
import {
    queryCreateSharedLink,
    querySharedLinks,
    queryUpdateSharedLink,
    queryDeleteSharedLink,
    queryDeleteMultipleSharedLinks,
} from '../../api/sharing';
import useDrive from './useDrive';
import useDriveCrypto from './useDriveCrypto';
import useDebouncedRequest from '../util/useDebouncedRequest';
import {
    BATCH_REQUEST_SIZE,
    DEFAULT_SHARE_MAX_ACCESSES,
    FOLDER_PAGE_SIZE,
    MAX_THREADS_PER_REQUEST,
    RESPONSE_CODE,
    SHARE_GENERATED_PASSWORD_LENGTH,
} from '../../constants';
import { SharedURLFlags, SharedURLSessionKeyPayload, ShareURL, UpdateSharedURL } from '../../interfaces/sharing';
import { LinkMeta } from '../../interfaces/link';
import { useDriveCache } from '../../components/DriveCache/DriveCacheProvider';

function useSharing() {
    const { getPrimaryAddressKey } = useDriveCrypto();
    const { createShare, getLinkMeta } = useDrive();
    const cache = useDriveCache();
    const api = useApi();
    const debouncedRequest = useDebouncedRequest();
    const { preventLeave } = usePreventLeave();

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
        password: string,
        shareInfo?: { ID: string; sessionKey: SessionKey }
    ) => {
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
                Flags: 0,
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
     * Password can come in several shapes:
     * - <custom>, flags === 1 – legacy custom password (comes separately from generated)
     * - <generated>, flags === 3 – empty custom password
     * - <generated><custom>, flags === 3, contains both generated and custom paswords
     */
    const getSharedLinkUpdatedFlags = (password: string, flags: number) => {
        /*
         * There are three bit array states that can be returned here:
         * - `0` – all bits are zero, meaning file's only protected with
         * generated password. If newPassword's length equals SHARE_GENERATED_PASSWORD_LENGTH
         * it means no custom password was provided.
         * - `3` - first and second bits equal one (having both CustomPassword and
         * GeneratedPasswordIncluded flags active).
         * - `1` - first bit equals one, meaning we encounter a link protected
         * with a legacy password. We disable password deletion for these files
         * and their flags must stay as they were.
         */
        if (password.length === SHARE_GENERATED_PASSWORD_LENGTH && flags & SharedURLFlags.GeneratedPasswordIncluded) {
            return 0;
        }

        if ((flags & SharedURLFlags.CustomPassword) === 0 || flags & SharedURLFlags.GeneratedPasswordIncluded) {
            return SharedURLFlags.CustomPassword | SharedURLFlags.GeneratedPasswordIncluded;
        }

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
            computeKeyPassword(newPassword, sharePasswordSalt).then((sharedLinkPassword: string) =>
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
        const { privateKey } = await getPrimaryAddressKey();
        const decryptedPassword = await decryptUnsigned({
            armoredMessage: Password,
            privateKey,
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

    const deleteSharedLink = (sharedURLShareId: string, token: string) => {
        return api(queryDeleteSharedLink(sharedURLShareId, token));
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
        return ([] as string[]).concat(...deletedIds);
    };

    return {
        updateSharedLink,
        decryptSharedLink,
        createSharedLink,
        getSharedURLs,
        deleteSharedLink,
        fetchNextPage,
        deleteMultipleSharedLinks,
    };
}

export default useSharing;
