import type { PrivateKeyReference, SessionKey } from '@proton/crypto';
import { CryptoProxy, serverTime, updateServerTime } from '@proton/crypto';
import type { SafeErrorObject } from '@proton/utils/getSafeErrorObject';
import { getSafeErrorObject } from '@proton/utils/getSafeErrorObject';

import { convertSafeError } from '../../utils/errorHandling/EnrichedError';
import { RefreshError, getRefreshError } from '../../utils/errorHandling/RefreshError';
import { HEARTBEAT_INTERVAL, HEARTBEAT_WAIT_TIME, WORKER_INIT_WAIT_TIME } from './constants';
import type {
    EncryptedBlock,
    FileKeys,
    FileRequestBlock,
    Link,
    PhotoUpload,
    ThumbnailEncryptedBlock,
    ThumbnailRequestBlock,
    VerificationData,
} from './interface';
import type { Media, ThumbnailInfo } from './media';

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
    isForPhotos: boolean;
    thumbnails?: ThumbnailInfo[];
    media?: Media;
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
            isForPhotos,
            media,
            thumbnails,
        }: {
            mimeType: string;
            isForPhotos: boolean;
            thumbnails?: ThumbnailInfo[];
            media?: Media;
        },
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
    photo?: PhotoUpload;
};

type NetworkErrorMessage = {
    command: 'network_error';
    error: SafeErrorObject;
};

type ErrorMessage = {
    command: 'error';
    error: SafeErrorObject;
};

type NotifyVerificationError = {
    command: 'notify_verification_error';
    retryHelped: boolean;
};

type HeartbeatMessage = {
    command: 'heartbeat';
};

type WorkerAliveMessage = {
    command: 'alive';
};

type LogMessage = {
    command: 'log';
    message: string;
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
        | NotifyVerificationError
        | HeartbeatMessage
        | WorkerAliveMessage
        | LogMessage;
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
    finalize: (signature: string, signatureAddress: string, xattr: string, photo?: PhotoUpload) => void;
    onNetworkError: (error: Error) => void;
    onError: (error: Error) => void;
    onHeartbeatTimeout: () => void;
    onCancel: () => void;
    notifySentry: (error: Error) => void;
    notifyVerificationError: (retryHelped: boolean) => void;
}

/**
 * UploadWorker provides communication between the main thread and upload web
 * worker. The class ensures type safety as much as possible.
 * UploadWorker is meant to be used on the side of the web worker.
 */
export class UploadWorker {
    worker: Worker;

    heartbeatInterval?: NodeJS.Timeout;

    constructor(worker: Worker, { generateKeys, start, createdBlocks, pause, resume }: WorkerHandlers) {
        // Before the worker termination, we want to release securely crypto
        // proxy. That might need a bit of time, and we allow up to few seconds
        // before we terminate the worker. During the releasing time, crypto
        // might be failing, so any error should be ignored.
        let closing = false;

        this.worker = worker;

        // Notify the main thread we are alive.
        // We use this message to check for failures to load the worker.
        this.postWorkerAlive();

        // Set up the heartbeat. This notifies the main thread that the worker is still alive.
        this.heartbeatInterval = setInterval(() => this.postHeartbeat(), HEARTBEAT_INTERVAL);

        worker.addEventListener('message', ({ data }: WorkerControllerEvent) => {
            switch (data.command) {
                case 'generate_keys':
                    (async (data) => {
                        let module;
                        // Dynamic import is needed since we want pmcrypto (incl. openpgpjs) to be loaded
                        // inside the worker, not in the main thread.
                        // Warning: Do not rename the "crypto-worker-api" naming as this is also used in the initDriveWorker.ts file
                        try {
                            module = await import(
                                /* webpackChunkName: "crypto-worker-api" */ '@proton/crypto/lib/worker/api'
                            );
                        } catch (e: any) {
                            console.warn(e);
                            this.postError(new RefreshError());
                            return;
                        }

                        const { Api: CryptoApi } = module;

                        CryptoApi.init();
                        CryptoProxy.setEndpoint(new CryptoApi(), (endpoint) => endpoint.clearKeyStore());

                        // align serverTime in worker with the main thread (received from API)
                        updateServerTime(data.serverTime);

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
                                isForPhotos: data.isForPhotos,
                                thumbnails: data.thumbnails,
                                media: data.media,
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
                    this.clearHeartbeatInterval();
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

            this.postError(event.error || new Error(event.message));
        });
        // @ts-ignore
        worker.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
            event.preventDefault();
            if (closing) {
                return;
            }

            let error = event.reason;

            if (typeof error === 'string') {
                error = new Error(error);
            }

            this.postError(error);
        });
    }

    clearHeartbeatInterval() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
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
        } satisfies KeysGeneratedMessage);
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
                index: thumbnailBlock.index,
                size: thumbnailBlock.encryptedData.byteLength,
                hash: thumbnailBlock.hash,
                type: thumbnailBlock.thumbnailType,
            })),
        } satisfies CreateBlockMessage);
    }

    postProgress(increment: number) {
        this.worker.postMessage({
            command: 'progress',
            increment,
        } satisfies ProgressMessage);
    }

    postDone(signature: string, signatureAddress: string, xattr: string, photo?: PhotoUpload) {
        this.worker.postMessage({
            command: 'done',
            signature,
            signatureAddress,
            xattr,
            photo,
        } satisfies DoneMessage);
    }

    postNetworkError(error: Error) {
        this.worker.postMessage({
            command: 'network_error',
            error: getSafeErrorObject(error),
        } satisfies NetworkErrorMessage);
    }

    postError(error: Error) {
        if (!error) {
            error = new Error('Unknown error');
        }

        this.worker.postMessage({
            command: 'error',
            error: getSafeErrorObject(error),
        } satisfies ErrorMessage);
    }

    notifyVerificationError(retryHelped: boolean) {
        this.worker.postMessage({
            command: 'notify_verification_error',
            retryHelped,
        } satisfies NotifyVerificationError);
    }

    postHeartbeat() {
        this.worker.postMessage({
            command: 'heartbeat',
        } satisfies HeartbeatMessage);
    }

    postWorkerAlive() {
        this.worker.postMessage({
            command: 'alive',
        } satisfies WorkerAliveMessage);
    }

    postLog(message: string) {
        this.worker.postMessage({
            command: 'log',
            message,
        } satisfies LogMessage);
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

    heartbeatTimeout?: NodeJS.Timeout;

    /**
     * On Chrome, there is no way to know if a worker fails to load.
     * If the worker is not loaded, it simply won't respond to any messages at all.
     *
     * The heartbeat could handle this, but since it takes 30 seconds,
     * it's not particularly great UX. So instead we run a localized timeout, with a
     * quicker turn-around time in case of failure.
     */
    workerTimeout?: NodeJS.Timeout;

    constructor(
        worker: Worker,
        log: (message: string) => void,
        {
            keysGenerated,
            createBlocks,
            onProgress,
            finalize,
            onNetworkError,
            onError,
            onCancel,
            notifySentry,
            notifyVerificationError,
            onHeartbeatTimeout,
        }: WorkerControllerHandlers
    ) {
        this.worker = worker;
        this.onCancel = onCancel;

        this.workerTimeout = setTimeout(() => {
            worker?.terminate();
            onError(getRefreshError());
        }, WORKER_INIT_WAIT_TIME);

        worker.addEventListener('message', ({ data }: WorkerEvent) => {
            switch (data.command) {
                case 'alive':
                    log('Worker alive');
                    clearTimeout(this.workerTimeout);
                    break;
                case 'keys_generated':
                    log('File keys generated');
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
                        this.clearHeartbeatTimeout();
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
                    this.clearHeartbeatTimeout();
                    finalize(data.signature, data.signatureAddress, data.xattr, data.photo);
                    break;
                case 'network_error':
                    onNetworkError(data.error);
                    break;
                case 'error':
                    this.clearHeartbeatTimeout();

                    if (data.error.name === 'RefreshError') {
                        onError(getRefreshError());
                        break;
                    }

                    onError(convertSafeError(data.error));
                    break;
                case 'notify_verification_error':
                    notifyVerificationError(data.retryHelped);
                    break;
                case 'heartbeat':
                    log('Got heartbeat');
                    this.clearHeartbeatTimeout();

                    this.heartbeatTimeout = setTimeout(() => {
                        log('Heartbeat timeout');

                        notifySentry(new Error('Heartbeat was not received in time'));

                        onHeartbeatTimeout();

                        // Since the worker is stuck, we can terminate it
                        this.worker.terminate();
                    }, HEARTBEAT_WAIT_TIME);

                    break;
                case 'log':
                    log(data.message);
                    break;
                default:
                    // Type linters should prevent this error.
                    throw new Error('Unexpected message');
            }
        });
        worker.addEventListener('error', (event: ErrorEvent) => {
            // When a worker fails to load (i.e. 404), an error event is sent without ErrorEvent properties
            // This isn't properly documented, but basically, some browsers (Firefox) seem to handle
            // failure to load the worker URL in this way, so this is why we have this condition.
            // https://developer.mozilla.org/en-US/docs/Web/API/ErrorEvent
            if (!('filename' in event)) {
                onError(getRefreshError());
                return;
            }

            onError(event.error || new Error(event.message));
        });
    }

    clearHeartbeatTimeout() {
        if (this.heartbeatTimeout) {
            clearTimeout(this.heartbeatTimeout);
        }
    }

    terminate() {
        this.clearHeartbeatTimeout();
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
        } satisfies GenerateKeysMessage);
    }

    async postStart(
        file: File,
        {
            mimeType,
            isForPhotos,
            thumbnails,
            media,
        }: {
            mimeType: string;
            isForPhotos: boolean;
            thumbnails?: ThumbnailInfo[];
            media?: Media;
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
            isForPhotos: isForPhotos,
            thumbnails,
            media,
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
        } satisfies CreatedBlocksMessage);
    }

    postPause() {
        this.worker.postMessage({
            command: 'pause',
        } satisfies PauseMessage);
    }

    postResume() {
        this.worker.postMessage({
            command: 'resume',
        } satisfies ResumeMessage);
    }

    postClose() {
        this.worker.postMessage({
            command: 'close',
        } satisfies CloseMessage);
    }
}
