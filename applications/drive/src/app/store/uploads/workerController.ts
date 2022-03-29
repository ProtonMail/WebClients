import * as openpgp from 'openpgp';
// @ts-ignore
import { OpenPGPKey, SessionKey, updateServerTime, serverTime } from 'pmcrypto';

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
    pmcryptoTime: Date;
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

/**
 * WorkerControllerEvent contains all possible events which can come from
 * the main thread to the upload web worker.
 */
type WorkerControllerEvent = {
    data: GenerateKeysMessage | StartMessage | CreatedBlocksMessage | PauseMessage | ResumeMessage;
};

/**
 * WorkerHandlers defines what handlers are available to be used in the upload
 * web worker to messages from the main thread defined in WorkerControllerEvent.
 */
interface WorkerHandlers {
    generateKeys: (addressPrivateKey: OpenPGPKey, parentPrivateKey: OpenPGPKey) => void;
    start: (
        file: File,
        thumbnailData: Uint8Array | undefined,
        addressPrivateKey: OpenPGPKey,
        addressEmail: string,
        privateKey: OpenPGPKey,
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

async function readOpenPGPKey(binaryKey: Uint8Array): Promise<OpenPGPKey> {
    const keys = await openpgp.key.read(binaryKey);
    if (keys.err) {
        throw new Error(keys.err.join(', '));
    }
    if (keys.keys.length === 0) {
        throw new Error('Missing key');
    }
    return keys.keys[0];
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
                        updateServerTime(data.pmcryptoTime);
                        const addressPrivateKey = await readOpenPGPKey(data.addressPrivateKey);
                        const parentPrivateKey = await readOpenPGPKey(data.parentPrivateKey);
                        generateKeys(addressPrivateKey, parentPrivateKey);
                    })(data).catch((err) => {
                        this.postError(err);
                    });
                    break;
                case 'start':
                    (async (data) => {
                        const addressPrivateKey = await readOpenPGPKey(data.addressPrivateKey);
                        const privateKey = await readOpenPGPKey(data.privateKey);
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

    postKeysGenerated(keys: FileKeys) {
        this.worker.postMessage({
            command: 'keys_generated',
            ...keys,
            privateKey: keys.privateKey.toPacketlist().write(),
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
                        const privateKey = await readOpenPGPKey(data.privateKey);
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

    postGenerateKeys(addressPrivateKey: OpenPGPKey, parentPrivateKey: OpenPGPKey) {
        const pmcryptoTime = serverTime();
        this.worker.postMessage({
            command: 'generate_keys',
            addressPrivateKey: addressPrivateKey.toPacketlist().write(),
            parentPrivateKey: parentPrivateKey.toPacketlist().write(),
            pmcryptoTime,
        } as GenerateKeysMessage);
    }

    postStart(
        file: File,
        thumbnailData: Uint8Array | undefined,
        addressPrivateKey: OpenPGPKey,
        addressEmail: string,
        privateKey: OpenPGPKey,
        sessionKey: SessionKey
    ) {
        this.worker.postMessage({
            command: 'start',
            file,
            thumbnailData,
            addressPrivateKey: addressPrivateKey.toPacketlist().write(),
            addressEmail,
            privateKey: privateKey.toPacketlist().write(),
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
}
