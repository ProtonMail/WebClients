import { generateKeySaltAndPassphrase } from 'proton-shared/lib/keys/keys';
import { encryptSessionKey, splitMessage } from 'pmcrypto';
import { srpGetVerify } from 'proton-shared/lib/srp';
import { uint8ArrayToBase64String } from 'proton-shared/lib/helpers/encoding';
import { getUnixTime } from 'date-fns';
import { useApi } from 'react-components';
import { decryptUnsigned, encryptUnsigned } from 'proton-shared/lib/keys/driveKeys';
import { queryCreateSharedLink, querySharedURLs } from '../../api/shares';
import useDrive from './useDrive';
import useDriveCrypto from './useDriveCrypto';
import { DEFAULT_SHARE_EXPIRATION_DAYS, DEFAULT_SHARE_MAX_ACCESSES } from '../../constants';
import { ShareURL } from '../../interfaces/sharing';
import useDebouncedRequest from '../util/useDebouncedRequest';

function useSharing() {
    const { getPrimaryAddressKey } = useDriveCrypto();
    const { createShare } = useDrive();
    const api = useApi();
    const debouncedRequest = useDebouncedRequest();

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

            const { message } = await encryptSessionKey({
                data: sessionKey.data,
                algorithm: sessionKey.algorithm,
                passwords: [sharedLinkPassword],
            });
            const {
                symmetric: [bytes],
            } = await splitMessage(message);
            const SharePassphraseKeyPacket = uint8ArrayToBase64String(bytes);

            return {
                SharePasswordSalt,
                SharePassphraseKeyPacket,
            };
        };

        const getCreatorEmailAndPassword = async () => {
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

        const [
            { SharePasswordSalt, SharePassphraseKeyPacket },
            { CreatorEmail, Password },
            {
                Auth: { Salt: UrlPasswordSalt, Verifier: SRPVerifier, ModulusID: SRPModulusID },
            },
        ] = await Promise.all([
            getSharedLinkPassphraseAndKeyPacket(),
            getCreatorEmailAndPassword(),
            srpGetVerify({
                api,
                credentials,
            }),
        ]);

        // Simple math instead of addDays because we don't need to compensate for DST
        const ExpirationTime = getUnixTime(new Date()) + DEFAULT_SHARE_EXPIRATION_DAYS * 24 * 60 * 60;

        return api<{ ShareURL: ShareURL }>(
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
    };

    const getSharedURLs = async (sharedURLShareId: string) => {
        const [{ ShareURLs }, { privateKey }] = await Promise.all([
            debouncedRequest<{ ShareURLs: ShareURL[] }>(querySharedURLs(sharedURLShareId)),
            getPrimaryAddressKey(),
        ]);

        return Promise.all(
            ShareURLs.map(async (sharedURL) => {
                sharedURL.Password = await decryptUnsigned({
                    armoredMessage: sharedURL.Password,
                    privateKey,
                });
                return sharedURL;
            })
        );
    };

    return {
        createSharedLink,
        getSharedURLs,
    };
}

export default useSharing;
