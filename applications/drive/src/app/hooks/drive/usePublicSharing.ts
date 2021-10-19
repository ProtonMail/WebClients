import { ReadableStream } from 'web-streams-polyfill';
import { decryptMessage, decryptPrivateKey, getMessage, OpenPGPKey, SessionKey } from 'pmcrypto';

import { computeKeyPassword } from '@proton/srp';
import { useApi } from '@proton/components';
import { srpAuth } from '@proton/shared/lib/srp';
import { base64StringToUint8Array } from '@proton/shared/lib/helpers/encoding';
import { decryptUnsigned, getStreamMessage } from '@proton/shared/lib/keys/driveKeys';
import { queryInitSRPHandshake, queryGetSharedLinkPayload } from '@proton/shared/lib/api/drive/sharing';
import { InitHandshake, SharedLinkPayload, SharedLinkInfo, ThumbnailURLInfo } from '@proton/shared/lib/interfaces/drive/sharing';
import { DriveFileBlock } from '@proton/shared/lib/interfaces/drive/file';
import { TransferMeta } from '@proton/shared/lib/interfaces/drive/transfer';
import { getDecryptedSessionKey } from '@proton/shared/lib/keys/drivePassphrase';

import { startDownload, StreamTransformer } from '../../components/downloads/download';
import { useDownloadProvider } from '../../components/downloads/DownloadProvider';

function usePublicSharing() {
    const api = useApi();
    const { addToDownloadQueue } = useDownloadProvider();

    const initSRPHandshake = async (token: string) => {
        return api<InitHandshake>(queryInitSRPHandshake(token));
    };

    const getSharedLinkPayload = async (
        token: string,
        password: string,
        initHandshake: InitHandshake,
        pagination?: {
            FromBlockIndex: number;
            PageSize: number;
        }
    ): Promise<SharedLinkInfo> => {
        const { Modulus, ServerEphemeral, UrlPasswordSalt, SRPSession, Version } = initHandshake;

        const { Payload } = await srpAuth<{ Code: number; Payload: SharedLinkPayload }>({
            api,
            credentials: { password },
            info: {
                Modulus,
                ServerEphemeral,
                Version,
                Salt: UrlPasswordSalt,
                SRPSession,
            },
            config: queryGetSharedLinkPayload(token, pagination),
        });

        const Blocks: DriveFileBlock[] = Payload.BlockURLs.map(({ BareURL, Token }, Index: number) => {
            return {
                Index: Index + 1,
                BareURL,
                Token,
            };
        });

        const [passphraseAsMessage, computedPassword] = await Promise.all([
            getMessage(Payload.SharePassphrase),
            computeKeyPassword(password, Payload.SharePasswordSalt),
        ]);
        const sharePassphrase = await decryptMessage({
            message: passphraseAsMessage,
            passwords: [computedPassword],
        });

        const shareKey = await decryptPrivateKey(Payload.ShareKey, sharePassphrase.data);
        const [Name, NodePassphrase] = await Promise.all([
            decryptUnsigned({ armoredMessage: Payload.Name, privateKey: shareKey }),
            decryptUnsigned({ armoredMessage: Payload.NodePassphrase, privateKey: shareKey }),
        ]);
        const NodeKey = await decryptPrivateKey(Payload.NodeKey, NodePassphrase);
        const blockKeys = base64StringToUint8Array(Payload.ContentKeyPacket);
        const SessionKey = await getDecryptedSessionKey({ data: blockKeys, privateKeys: NodeKey });

        return {
            Name,
            MIMEType: Payload.MIMEType,
            Size: Payload.Size,
            ExpirationTime: Payload.ExpirationTime,
            Blocks,
            NodeKey,
            SessionKey,
            ThumbnailURLInfo: {
                BareURL: Payload.ThumbnailURLInfo.BareURL,
                Token: Payload.ThumbnailURLInfo.Token,
            },
        };
    };

    const decryptSharedBlockStream =
        (sessionKey: SessionKey, privateKey: OpenPGPKey): StreamTransformer =>
        async (stream: ReadableStream<Uint8Array>) => {
            // TODO: implement root hash validation when file updates are implemented

            const { data } = await decryptMessage({
                message: await getStreamMessage(stream),
                sessionKeys: sessionKey,
                publicKeys: privateKey.toPublic(),
                streaming: 'web',
                format: 'binary',
            });

            return data as ReadableStream<Uint8Array>;
        };

    const getSharedFileBlocks = async (
        token: string,
        password: string,
        pagination?: {
            FromBlockIndex: number;
            PageSize: number;
        }
    ) => {
        const handshakeInfo = await initSRPHandshake(token);
        const payload = await getSharedLinkPayload(token, password, handshakeInfo, pagination);
        return payload.Blocks;
    };

    const startSharedFileTransfer = (
        sessionKey: SessionKey,
        privateKey: OpenPGPKey,
        meta: TransferMeta,
        token: string,
        password: string,
        initailBlocks: DriveFileBlock[]
    ) => {
        return addToDownloadQueue(
            meta,
            { ShareID: 'SharedFile', LinkID: 'SharedFile' },
            {
                transformBlockStream: decryptSharedBlockStream(sessionKey, privateKey),
                getBlocks: async (
                    _abortSignal: AbortSignal,
                    pagination?:
                        | {
                              FromBlockIndex: number;
                              PageSize: number;
                          }
                        | undefined
                ) =>
                    pagination?.FromBlockIndex === 1 ? initailBlocks : getSharedFileBlocks(token, password, pagination),
            }
        );
    };

    const downloadThumbnail = (sessionKey: SessionKey, privateKey: OpenPGPKey, params: ThumbnailURLInfo) => {
        return startDownload(api, {
            getBlocks: async () => [
                {
                    Index: 1,
                    BareURL: params.BareURL,
                    Token: params.Token,
                },
            ],
            transformBlockStream: decryptSharedBlockStream(sessionKey, privateKey),
        });
    };

    return {
        initSRPHandshake,
        getSharedLinkPayload,
        startSharedFileTransfer,
        downloadThumbnail,
    };
}

export default usePublicSharing;
