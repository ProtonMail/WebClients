import { CryptoProxy, SessionKey, updateServerTime, serverTime, PrivateKeyReference } from '@proton/crypto';

import {
    FileKeys,
    EncryptedBlock,
    EncryptedThumbnailBlock,
    FileRequestBlock,
    ThumbnailRequestBlock,
    Link,
    BlockToken,
} from './interface';
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
    thumbnailData?: Uint8Array;
    addressPrivateKey: Uint8Array;
    addressEmail: string;
    privateKey: Uint8Array;
    sessionKey: SessionKey;
};

type CreatedBlocksMessage = {
    command: 'created_blocks';
    fileLinks: Link[];
    thumbnailLink?: Link;
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
        thumbnailData: Uint8Array | undefined,
        addressPrivateKey: PrivateKeyReference,
        addressEmail: string,
        privateKey: PrivateKeyReference,
        sessionKey: SessionKey
    ) => void;
    createdBlocks: (fileLinks: Link[], thumbnailLink?: Link) => void;
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
    thumbnailBlock?: ThumbnailRequestBlock;
};

type ProgressMessage = {
    command: 'progress';
    increment: number;
};

type DoneMessage = {
    command: 'done';
    blockTokens: BlockToken[];
    signature: string;
    signatureAddress: string;
    xattr: string;
};

type NetworkErrorMessage = {
    command: 'network_error';
    error: string;
};

type ErrorMessage = {
    command: 'error';
    error: string;
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
        | ErrorMessage;
};

/**
 * WorkerControllerHandlers defines what handlers are available to be used
 * in the main thread to messages from the upload web worked defined in
 * WorkerEvent.
 */
interface WorkerControllerHandlers {
    keysGenerated: (keys: FileKeys) => void;
    createBlocks: (fileBlocks: FileRequestBlock[], thumbnailBlock?: ThumbnailRequestBlock) => void;
    onProgress: (increment: number) => void;
    finalize: (blockTokens: BlockToken[], signature: string, signatureAddress: string, xattr: string) => void;
    onNetworkError: (error: string) => void;
    onError: (error: string) => void;
    onCancel: () => void;
}

/**
 * UploadWorker provides communication between the main thread and upload web
 * worker. The class ensures type safety as much as possible.
 * UploadWorker is meant to be used on the side of the web worker.
 */
export class UploadWorker {
    worker: Worker;

    constructor(worker: Worker, { generateKeys, start, createdBlocks, pause, resume }: WorkerHandlers) {
        this.worker = worker;
        worker.addEventListener('message', ({ data }: WorkerControllerEvent) => {
            switch (data.command) {
                case 'generate_keys':
                    (async (data) => {
                        // Setup CryptoProxy
                        // Dynamic import is needed since we want pmcrypto (incl. openpgpjs) to be loaded inside the worker, not in the main thread.
                        const { Api: CryptoApi } = await import('@proton/crypto/lib/worker/api');
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
                            data.thumbnailData,
                            addressPrivateKey,
                            data.addressEmail,
                            privateKey,
                            data.sessionKey
                        );
                    })(data).catch((err) => {
                        this.postError(err);
                    });
                    break;
                case 'created_blocks':
                    createdBlocks(data.fileLinks, data.thumbnailLink);
                    break;
                case 'pause':
                    pause();
                    break;
                case 'resume':
                    resume();
                    break;
                case 'close':
                    void CryptoProxy.releaseEndpoint().then(() => self.close());
                    break;
                default:
                    // Type linters should prevent this error.
                    throw new Error('Unexpected message');
            }
        });
        worker.addEventListener('error', (event: ErrorEvent) => {
            this.postError(getErrorString(event.error, event.message));
        });
        // @ts-ignore
        worker.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
            event.preventDefault();
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

    postCreateBlocks(fileBlocks: EncryptedBlock[], encryptedThumbnailBlock?: EncryptedThumbnailBlock) {
        this.worker.postMessage({
            command: 'create_blocks',
            fileBlocks: fileBlocks.map((block) => ({
                index: block.index,
                signature: block.signature,
                size: block.encryptedData.byteLength,
                hash: block.hash,
            })),
            thumbnailBlock: !encryptedThumbnailBlock
                ? undefined
                : {
                      size: encryptedThumbnailBlock.encryptedData.byteLength,
                      hash: encryptedThumbnailBlock.hash,
                  },
        } as CreateBlockMessage);
    }

    postProgress(increment: number) {
        this.worker.postMessage({
            command: 'progress',
            increment,
        } as ProgressMessage);
    }

    postDone(blockTokens: BlockToken[], signature: string, signatureAddress: string, xattr: string) {
        this.worker.postMessage({
            command: 'done',
            blockTokens,
            signature,
            signatureAddress,
            xattr,
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
                    createBlocks(data.fileBlocks, data.thumbnailBlock);
                    break;
                case 'progress':
                    onProgress(data.increment);
                    break;
                case 'done':
                    finalize(data.blockTokens, data.signature, data.signatureAddress, data.xattr);
                    break;
                case 'network_error':
                    onNetworkError(data.error);
                    break;
                case 'error':
                    onError(data.error);
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
        thumbnailData: Uint8Array | undefined,
        addressPrivateKey: PrivateKeyReference,
        addressEmail: string,
        privateKey: PrivateKeyReference,
        sessionKey: SessionKey
    ) {
        this.worker.postMessage({
            command: 'start',
            file,
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
        } as StartMessage);
    }

    postCreatedBlocks(fileLinks: Link[], thumbnailLink?: Link) {
        this.worker.postMessage({
            command: 'created_blocks',
            fileLinks,
            thumbnailLink,
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
