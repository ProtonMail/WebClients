import { generateKeySaltAndPassphrase } from 'proton-shared/lib/keys/keys';
import { encryptSessionKey, splitMessage, decryptSessionKey, getMessage, SessionKey } from 'pmcrypto';
import { computeKeyPassword } from 'pm-srp';
import { srpGetVerify } from 'proton-shared/lib/srp';
import { base64StringToUint8Array, uint8ArrayToBase64String } from 'proton-shared/lib/helpers/encoding';
import { getUnixTime } from 'date-fns';
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
import { DEFAULT_SHARE_EXPIRATION_DAYS, DEFAULT_SHARE_MAX_ACCESSES } from '../../constants';
import { SharedURLFlags, SharedURLSessionKeyPayload, ShareURL, UpdateSharedURL } from '../../interfaces/sharing';
import useDebouncedRequest from '../util/useDebouncedRequest';
import { validateSharedURLPassword, ValidationError } from '../../utils/validation';

function useSharing() {
    const { getPrimaryAddressKey } = useDriveCrypto();
    const { createShare } = useDrive();
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

        // Simple math instead of addDays because we don't need to compensate for DST
        const ExpirationTime = getUnixTime(new Date()) + DEFAULT_SHARE_EXPIRATION_DAYS * 24 * 60 * 60;

        const { ShareURL } = await api<{ ShareURL: ShareURL }>(
            queryCreateSharedLink(ID, {
                Flags: 0,
                Permissions: 4,
                MaxAccesses: DEFAULT_SHARE_MAX_ACCESSES,
                CreatorEmail,
                ExpirationTime,
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
        const { ShareURLs } = await debouncedRequest<{ ShareURLs: ShareURL[] }>(querySharedLinks(sharedURLShareId));
        return ShareURLs;
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
        updateSharedLinkPassword,
        decryptSharedLink,
        createSharedLink,
        getSharedURLs,
        deleteSharedLink,
    };
}

export default useSharing;
