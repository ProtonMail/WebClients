import { generateKeySaltAndPassphrase } from 'proton-shared/lib/keys/keys';
import { encryptSessionKey, splitMessage, decryptSessionKey, getMessage, SessionKey } from 'pmcrypto';
import { computeKeyPassword } from 'pm-srp';
import { srpGetVerify } from 'proton-shared/lib/srp';
import { base64StringToUint8Array, uint8ArrayToBase64String } from 'proton-shared/lib/helpers/encoding';
import { useApi } from 'react-components';
import { decryptUnsigned, encryptUnsigned } from 'proton-shared/lib/keys/driveKeys';
import {
    queryCreateSharedLink,
    querySharedLinks,
    queryUpdateSharedLink,
    queryDeleteSharedLink,
} from '../../api/sharing';
import useDrive from './useDrive';
import useDriveCrypto from './useDriveCrypto';
import { DEFAULT_SHARE_MAX_ACCESSES, EXPIRATION_DAYS, FOLDER_PAGE_SIZE } from '../../constants';
import { SharedURLFlags, SharedURLSessionKeyPayload, ShareURL, UpdateSharedURL } from '../../interfaces/sharing';
import useDebouncedRequest from '../util/useDebouncedRequest';
import { validateSharedURLPassword, ValidationError } from '../../utils/validation';
import { getDurationInSeconds } from '../../components/Drive/helpers';
import { useDriveCache } from '../../components/DriveCache/DriveCacheProvider';
import { LinkMeta } from '../../interfaces/link';

function useSharing() {
    const { getPrimaryAddressKey } = useDriveCrypto();
    const { createShare, decryptLink, getLinkKeys, getShareKeys } = useDrive();
    const cache = useDriveCache();
    const api = useApi();
    const debouncedRequest = useDebouncedRequest();

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

    const createSharedLink = async (shareId: string, volumeId: string, linkId: string, password: string) => {
        const credentials = { password };

        const {
            Share: { ID },
            keyInfo: { sessionKey },
        } = await createShare(shareId, volumeId, linkId);

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

    const updateSharedLinkExpirationTime = async (shareId: string, token: string, newDuration: EXPIRATION_DAYS) => {
        const fieldsToUpdate: Partial<UpdateSharedURL> = {
            ExpirationDuration: getDurationInSeconds(newDuration),
        };
        const { ShareURL } = await api(queryUpdateSharedLink(shareId, token, fieldsToUpdate));
        return {
            ExpirationTime: ShareURL.ExpirationTime,
        };
    };

    const updateSharedLinkPassword = async (
        shareId: string,
        token: string,
        newPassword: string,
        keyInfo: SharedURLSessionKeyPayload
    ): Promise<Partial<UpdateSharedURL>> => {
        const error = validateSharedURLPassword(newPassword);

        if (error) {
            throw new ValidationError(error);
        }

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
            Flags: SharedURLFlags.CustomPassword,
            Password,
            SharePassphraseKeyPacket,
            SRPVerifier,
            SRPModulusID,
            UrlPasswordSalt,
        };
        await api(queryUpdateSharedLink(shareId, token, fieldsToUpdate));

        return {
            ...fieldsToUpdate,
            Password: newPassword,
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
            sharedLinks.map(async (meta) => {
                const { privateKey } = meta.ParentLinkID
                    ? await getLinkKeys(sharedURLShareId, meta.ParentLinkID, {
                          fetchLinkMeta: async (id) => Links[id],
                          preventRerenders: true,
                      })
                    : await getShareKeys(sharedURLShareId);

                return decryptLink(meta, privateKey);
            })
        );

        cache.set.sharedLinkMetas(
            decryptedLinks,
            sharedURLShareId,
            decryptedLinks.length < PageSize ? 'complete' : 'incremental'
        );

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

    return {
        updateSharedLinkExpirationTime,
        updateSharedLinkPassword,
        decryptSharedLink,
        createSharedLink,
        getSharedURLs,
        deleteSharedLink,
        fetchNextPage,
    };
}

export default useSharing;
