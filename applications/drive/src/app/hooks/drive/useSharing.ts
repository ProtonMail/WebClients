import { generateKeySaltAndPassphrase } from 'proton-shared/lib/keys/keys';
import { encryptSessionKey, splitMessage, decryptSessionKey, getMessage, SessionKey } from 'pmcrypto';
import { computeKeyPassword } from 'pm-srp';
import { srpGetVerify } from 'proton-shared/lib/srp';
import { base64StringToUint8Array, uint8ArrayToBase64String } from 'proton-shared/lib/helpers/encoding';
import { chunk } from 'proton-shared/lib/helpers/array';
import { decryptUnsigned, encryptUnsigned } from 'proton-shared/lib/keys/driveKeys';
import runInQueue from 'proton-shared/lib/helpers/runInQueue';
import { useApi, usePreventLeave } from 'react-components';
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

        // Old shares with legacy custom password has to stay that way, so the
        // old links still works. But all new shares should use new logic.
        let newFlags = SharedURLFlags.CustomPassword;
        if ((flags & SharedURLFlags.CustomPassword) === 0 || flags & SharedURLFlags.GeneratedPasswordIncluded) {
            newFlags |= SharedURLFlags.GeneratedPasswordIncluded;
        }

        const fieldsToUpdate: Partial<UpdateSharedURL> = {
            Flags: newFlags,
            Password,
            SharePassphraseKeyPacket,
            SRPVerifier,
            SRPModulusID,
            UrlPasswordSalt,
        };

        return fieldsToUpdate;
    };

    const updateSharedLink = async (
        shareId: string,
        token: string,
        flags: number,
        keyInfo: SharedURLSessionKeyPayload,
        newDuration?: number | null,
        newPassword?: string
    ) => {
        let fieldsToUpdate: Partial<UpdateSharedURL> = {};
        if (newDuration !== undefined) {
            fieldsToUpdate = { ExpirationDuration: newDuration };
        }
        if (newPassword) {
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

        const deleteSharedQueue = batches.map((batch) => () =>
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
