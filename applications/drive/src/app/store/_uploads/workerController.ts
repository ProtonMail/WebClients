import { CryptoProxy, PrivateKeyReference, SessionKey, serverTime, updateServerTime } from '@proton/crypto';
import { SafeErrorObject, getSafeErrorObject } from '@proton/utils/getSafeErrorObject';

import type {
    EncryptedBlock,
    FileKeys,
    FileRequestBlock,
    Link,
    Photo,
    ThumbnailEncryptedBlock,
    ThumbnailRequestBlock,
    VerificationData,
} from './interface';
import type { ThumbnailData } from './thumbnail';
import { getErrorString } from './utils';

type GenerateKeysMessage = {
    command: 'generate_keys';
    addressPrivateKey: Uint8Array;
    parentPrivateKey: Uint8Array;
    serverTime: Date;
};

type StartMessage = {
    command: 'start';
    file: File;
    mimeType: string;
    isPhoto: boolean;
    thumbnailData?: ThumbnailData[];
    addressPrivateKey: Uint8Array;
    addressEmail: string;
    privateKey: Uint8Array;
    sessionKey: SessionKey;
    parentHashKey: Uint8Array;
    verificationData: VerificationData;
};

type CreatedBlocksMessage = {
    command: 'created_blocks';
    fileLinks: Link[];
    thumbnailLinks?: Link[];
};

type PauseMessage = {
    command: 'pause';
};

type ResumeMessage = {
    command: 'resume';
};

type CloseMessage = {
    command: 'close';
};

/**
 * WorkerControllerEvent contains all possible events which can come from
 * the main thread to the upload web worker.
 */
type WorkerControllerEvent = {
    data: GenerateKeysMessage | StartMessage | CreatedBlocksMessage | PauseMessage | ResumeMessage | CloseMessage;
};

/**
 * WorkerHandlers defines what handlers are available to be used in the upload
 * web worker to messages from the main thread defined in WorkerControllerEvent.
 */
interface WorkerHandlers {
    generateKeys: (addressPrivateKey: PrivateKeyReference, parentPrivateKey: PrivateKeyReference) => void;
    start: (
        file: File,
        {
            mimeType,
            isPhoto,
            thumbnailData,
        }: { mimeType: string; isPhoto: boolean; thumbnailData: ThumbnailData[] | undefined },
        addressPrivateKey: PrivateKeyReference,
        addressEmail: string,
        privateKey: PrivateKeyReference,
        sessionKey: SessionKey,
        parentHashKey: Uint8Array,
        verificationData: VerificationData
    ) => void;
    createdBlocks: (fileLinks: Link[], thumbnailLinks?: Link[]) => void;
    pause: () => void;
    resume: () => void;
}

type KeysGeneratedMessage = {
    command: 'keys_generated';
    nodeKey: string;
    nodePassphrase: string;
    nodePassphraseSignature: string;
    contentKeyPacket: string;
    contentKeyPacketSignature: string;
    privateKey: Uint8Array;
    sessionKey: SessionKey;
};

type CreateBlockMessage = {
    command: 'create_blocks';
    fileBlocks: FileRequestBlock[];
    thumbnailBlocks?: ThumbnailRequestBlock[];
};

type ProgressMessage = {
    command: 'progress';
    increment: number;
};

type DoneMessage = {
    command: 'done';
    signature: string;
    signatureAddress: string;
    xattr: string;
    photo?: Photo;
};

type NetworkErrorMessage = {
    command: 'network_error';
    error: string;
};

type ErrorMessage = {
    command: 'error';
    error: string;
};

type NotifySentryMessage = {
    command: 'notify_sentry';
    error: SafeErrorObject;
};

/**
 * WorkerEvent contains all possible events which can come from the upload
 * web worker to the main thread.
 */
type WorkerEvent = {
    data:
        | KeysGeneratedMessage
        | CreateBlockMessage
        | ProgressMessage
        | DoneMessage
        | NetworkErrorMessage
        | ErrorMessage
        | NotifySentryMessage;
};

/**
 * WorkerControllerHandlers defines what handlers are available to be used
 * in the main thread to messages from the upload web worked defined in
 * WorkerEvent.
 */
interface WorkerControllerHandlers {
    keysGenerated: (keys: FileKeys) => void;
    createBlocks: (fileBlocks: FileRequestBlock[], thumbnailBlocks?: ThumbnailRequestBlock[]) => void;
    onProgress: (increment: number) => void;
    finalize: (signature: string, signatureAddress: string, xattr: string, photo?: Photo) => void;
    onNetworkError: (error: string) => void;
    onError: (error: string) => void;
    onCancel: () => void;
    notifySentry: (error: Error) => void;
}

/**
 * UploadWorker provides communication between the main thread and upload web
 * worker. The class ensures type safety as much as possible.
 * UploadWorker is meant to be used on the side of the web worker.
 */
export class UploadWorker {
    worker: Worker;

    constructor(worker: Worker, { generateKeys, start, createdBlocks, pause, resume }: WorkerHandlers) {
        // Before the worker termination, we want to release securely crypto
        // proxy. That might need a bit of time, and we allow up to few seconds
        // before we terminate the worker. During the releasing time, crypto
        // might be failing, so any error should be ignored.
        let closing = false;

        this.worker = worker;
        worker.addEventListener('message', ({ data }: WorkerControllerEvent) => {
            switch (data.command) {
                case 'generate_keys':
                    (async (data) => {
                        // Setup CryptoProxy
                        // Dynamic import is needed since we want pmcrypto (incl. openpgpjs) to be loaded inside the worker, not in the main thread.
                        const { Api: CryptoApi } = await import(
                            /* webpackChunkName: "crypto-worker-api" */ '@proton/crypto/lib/worker/api'
                        );
                        CryptoApi.init();
                        CryptoProxy.setEndpoint(new CryptoApi(), (endpoint) => endpoint.clearKeyStore());
                        updateServerTime(data.serverTime); // align serverTime in worker with that of the main thread (received from API)

                        const addressPrivateKey = await CryptoProxy.importPrivateKey({
                            binaryKey: data.addressPrivateKey,
                            passphrase: null,
                        });
                        const parentPrivateKey = await CryptoProxy.importPrivateKey({
                            binaryKey: data.parentPrivateKey,
                            passphrase: null,
                        });
                        generateKeys(addressPrivateKey, parentPrivateKey);
                    })(data).catch((err) => {
                        this.postError(err);
                    });
                    break;
                case 'start':
                    (async (data) => {
                        const addressPrivateKey = await CryptoProxy.importPrivateKey({
                            binaryKey: data.addressPrivateKey,
                            passphrase: null,
                        });
                        const privateKey = await CryptoProxy.importPrivateKey({
                            binaryKey: data.privateKey,
                            passphrase: null,
                        });
                        start(
                            data.file,
                            {
                                mimeType: data.mimeType,
                                isPhoto: data.isPhoto,
                                thumbnailData: data.thumbnailData,
                            },
                            addressPrivateKey,
                            data.addressEmail,
                            privateKey,
                            data.sessionKey,
                            data.parentHashKey,
                            data.verificationData
                        );
                    })(data).catch((err) => {
                        this.postError(err);
                    });
                    break;
                case 'created_blocks':
                    createdBlocks(data.fileLinks, data.thumbnailLinks);
                    break;
                case 'pause':
                    pause();
                    break;
                case 'resume':
                    resume();
                    break;
                case 'close':
                    closing = true;
                    void CryptoProxy.releaseEndpoint().then(() => self.close());
                    break;
                default:
                    // Type linters should prevent this error.
                    throw new Error('Unexpected message');
            }
        });
        worker.addEventListener('error', (event: ErrorEvent) => {
            if (closing) {
                return;
            }
            this.postError(getErrorString(event.error, event.message));
        });
        // @ts-ignore
        worker.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
            event.preventDefault();
            if (closing) {
                return;
            }
            this.postError(event.reason);
        });
    }

    async postKeysGenerated(keys: FileKeys) {
        this.worker.postMessage({
            command: 'keys_generated',
            ...keys,
            privateKey: await CryptoProxy.exportPrivateKey({
                privateKey: keys.privateKey,
                passphrase: null,
                format: 'binary',
            }),
        } as KeysGeneratedMessage);
    }

    postCreateBlocks(fileBlocks: EncryptedBlock[], encryptedThumbnailBlocks?: ThumbnailEncryptedBlock[]) {
        this.worker.postMessage({
            command: 'create_blocks',
            fileBlocks: fileBlocks.map<FileRequestBlock>((block) => ({
                index: block.index,
                signature: block.signature,
                size: block.encryptedData.byteLength,
                hash: block.hash,
                verificationToken: block.verificationToken,
            })),
            thumbnailBlocks: encryptedThumbnailBlocks?.map((thumbnailBlock) => ({
                size: thumbnailBlock.encryptedData.byteLength,
                hash: thumbnailBlock.hash,
                type: thumbnailBlock.thumbnailType,
            })),
        } as CreateBlockMessage);
    }

    postProgress(increment: number) {
        this.worker.postMessage({
            command: 'progress',
            increment,
        } as ProgressMessage);
    }

    postDone(signature: string, signatureAddress: string, xattr: string, photo?: Photo) {
        this.worker.postMessage({
            command: 'done',
            signature,
            signatureAddress,
            xattr,
            photo,
        } as DoneMessage);
    }

    postNetworkError(error: string) {
        this.worker.postMessage({
            command: 'network_error',
            error,
        } as NetworkErrorMessage);
    }

    postError(error: string) {
        this.worker.postMessage({
            command: 'error',
            error,
        } as ErrorMessage);
    }

    postNotifySentry(error: Error) {
        this.worker.postMessage({
            command: 'notify_sentry',
            error: getSafeErrorObject(error),
        } as NotifySentryMessage);
    }
}

/**
 * UploadWorkerController provides communication between the main thread and
 * upload web worker. The class ensures type safety as much as possible.
 * UploadWorkerController is meant to be used on the side of the main thread.
 */
export class UploadWorkerController {
    worker: Worker;

    onCancel: () => void;

    constructor(
        worker: Worker,
        {
            keysGenerated,
            createBlocks,
            onProgress,
            finalize,
            onNetworkError,
            onError,
            onCancel,
            notifySentry,
        }: WorkerControllerHandlers
    ) {
        this.worker = worker;
        this.onCancel = onCancel;
        worker.addEventListener('message', ({ data }: WorkerEvent) => {
            switch (data.command) {
                case 'keys_generated':
                    (async (data) => {
                        const privateKey = await CryptoProxy.importPrivateKey({
                            binaryKey: data.privateKey,
                            passphrase: null,
                        });
                        keysGenerated({
                            nodeKey: data.nodeKey,
                            nodePassphrase: data.nodePassphrase,
                            nodePassphraseSignature: data.nodePassphraseSignature,
                            contentKeyPacket: data.contentKeyPacket,
                            contentKeyPacketSignature: data.contentKeyPacketSignature,
                            privateKey,
                            sessionKey: data.sessionKey,
                        });
                    })(data).catch((err) => {
                        onError(err);
                    });
                    break;
                case 'create_blocks':
                    createBlocks(data.fileBlocks, data.thumbnailBlocks);
                    break;
                case 'progress':
                    onProgress(data.increment);
                    break;
                case 'done':
                    finalize(data.signature, data.signatureAddress, data.xattr, data.photo);
                    break;
                case 'network_error':
                    onNetworkError(data.error);
                    break;
                case 'error':
                    onError(data.error);
                    break;
                case 'notify_sentry':
                    notifySentry(data.error);
                    break;
                default:
                    // Type linters should prevent this error.
                    throw new Error('Unexpected message');
            }
        });
        worker.addEventListener('error', (event: ErrorEvent) => {
            onError(getErrorString(event.error, event.message));
        });
    }

    terminate() {
        this.worker.terminate();
    }

    cancel() {
        this.onCancel();
    }

    async postGenerateKeys(addressPrivateKey: PrivateKeyReference, parentPrivateKey: PrivateKeyReference) {
        this.worker.postMessage({
            command: 'generate_keys',
            addressPrivateKey: await CryptoProxy.exportPrivateKey({
                privateKey: addressPrivateKey,
                passphrase: null,
                format: 'binary',
            }),
            parentPrivateKey: await CryptoProxy.exportPrivateKey({
                privateKey: parentPrivateKey,
                passphrase: null,
                format: 'binary',
            }),
            serverTime: serverTime(),
        } as GenerateKeysMessage);
    }

    async postStart(
        file: File,
        {
            mimeType,
            isPhoto,
            thumbnailData,
        }: {
            mimeType: string;
            isPhoto: boolean;
            thumbnailData: ThumbnailData[] | undefined;
        },
        addressPrivateKey: PrivateKeyReference,
        addressEmail: string,
        privateKey: PrivateKeyReference,
        sessionKey: SessionKey,
        parentHashKey: Uint8Array,
        verificationData: VerificationData
    ) {
        this.worker.postMessage({
            command: 'start',
            file,
            mimeType,
            isPhoto,
            thumbnailData,
            addressPrivateKey: await CryptoProxy.exportPrivateKey({
                privateKey: addressPrivateKey,
                passphrase: null,
                format: 'binary',
            }),
            addressEmail,
            privateKey: await CryptoProxy.exportPrivateKey({
                privateKey: privateKey,
                passphrase: null,
                format: 'binary',
            }),
            sessionKey,
            parentHashKey,
            verificationData,
        } satisfies StartMessage);
    }

    postCreatedBlocks(fileLinks: Link[], thumbnailLinks?: Link[]) {
        this.worker.postMessage({
            command: 'created_blocks',
            fileLinks,
            thumbnailLinks,
        } as CreatedBlocksMessage);
    }

    postPause() {
        this.worker.postMessage({
            command: 'pause',
        } as PauseMessage);
    }

    postResume() {
        this.worker.postMessage({
            command: 'resume',
        } as ResumeMessage);
    }

    postClose() {
        this.worker.postMessage({
            command: 'close',
        });
    }
}
