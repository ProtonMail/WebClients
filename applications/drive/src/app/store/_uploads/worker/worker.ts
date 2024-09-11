import { sha1 } from '@noble/hashes/sha1';
import { getUnixTime } from 'date-fns';

import type { PrivateKeyReference, SessionKey } from '@proton/crypto';
import { arrayToHexString } from '@proton/crypto/lib/utils';
import { FILE_CHUNK_SIZE } from '@proton/shared/lib/drive/constants';
import {
    generateContentKeys,
    generateLookupHash,
    generateNodeKeys,
    sign as signMessage,
} from '@proton/shared/lib/keys/driveKeys';

import { encryptFileExtendedAttributes } from '../../_links';
import {
    getCaptureDateTime,
    getExifInfo,
    getPhotoDimensions,
    getPhotoExtendedAttributes,
} from '../../_photos/exifInfo';
import type { EncryptedBlock, Link, ThumbnailEncryptedBlock, VerificationData } from '../interface';
import type { Media, ThumbnailInfo } from '../media';
import { UploadWorker } from '../workerController';
import UploadWorkerBuffer from './buffer';
import { generateEncryptedBlocks, generateThumbnailEncryptedBlocks } from './encryption';
import { Pauser } from './pauser';
import startUploadJobs from './upload';
import { createVerifier } from './verifier';

declare const self: Worker;

const uploadWorker = new UploadWorker(self, { generateKeys, start, createdBlocks, pause, resume });

const pauser = new Pauser();
const buffer = new UploadWorkerBuffer();

async function generateKeys(addressPrivateKey: PrivateKeyReference, parentPrivateKey: PrivateKeyReference) {
    uploadWorker.postLog(`Generating keys`);
    try {
        const {
            NodeKey: nodeKey,
            privateKey,
            NodePassphrase: nodePassphrase,
            NodePassphraseSignature: nodePassphraseSignature,
        } = await generateNodeKeys(parentPrivateKey, addressPrivateKey);
        const {
            sessionKey,
            ContentKeyPacket: contentKeyPacket,
            ContentKeyPacketSignature: contentKeyPacketSignature,
        } = await generateContentKeys(privateKey);

        if (!contentKeyPacket) {
            uploadWorker.postError(new Error('Could not generate file keys'));
            return;
        }

        await uploadWorker.postKeysGenerated({
            nodeKey,
            nodePassphrase,
            nodePassphraseSignature,
            contentKeyPacket,
            contentKeyPacketSignature,
            sessionKey,
            privateKey,
        });
    } catch (err: any) {
        uploadWorker.postError(err);
    }
}

/**
 * start is the main functionality of the worker. When keys are generated
 * and file revision created, it passes all information to the worker to
 * do the upload job.
 * First it starts generator for encrypted blocks and pass it to buffer, so
 * it can be buffered and links on API requested. Once the main thread sends
 * back to worker created links, it can pass those blocks to upload jobs.
 * Once the upload jobs finishes, the final result is commited on API.
 * See UploadWorkerBuffer for more details.
 */
async function start(
    file: File,
    {
        mimeType,
        isForPhotos,
        media,
        thumbnails,
    }: {
        mimeType: string;
        isForPhotos: boolean;
        media?: Media;
        thumbnails?: ThumbnailInfo[];
    },
    addressPrivateKey: PrivateKeyReference,
    addressEmail: string,
    privateKey: PrivateKeyReference,
    sessionKey: SessionKey,
    parentHashKey: Uint8Array,
    verificationData: VerificationData
) {
    const log = (message: string) => uploadWorker.postLog(message);
    log(`Uploading started`);

    const hashInstance = sha1.create();
    const verifier = createVerifier(verificationData);

    buffer
        .feedEncryptedBlocks(
            generateEncryptedBlocks(
                file,
                addressPrivateKey,
                privateKey,
                sessionKey,
                (retryHelped) => uploadWorker.notifyVerificationError(retryHelped),
                hashInstance,
                verifier,
                log
            ),
            thumbnails && generateThumbnailEncryptedBlocks(thumbnails, addressPrivateKey, sessionKey, log)
        )
        .catch((err) => uploadWorker.postError(err));

    buffer.runBlockLinksCreation((blocks: EncryptedBlock[], thumbnailBlocks?: ThumbnailEncryptedBlock[]) => {
        uploadWorker.postCreateBlocks(blocks, thumbnailBlocks);
    });

    const uploadingBlocksGenerator = buffer.generateUploadingBlocks();
    const finish = async () => {
        uploadWorker.postLog(`Computing and validating manifest`);

        const fileHash = buffer.hash;
        const sha1Digest = hashInstance.digest();

        // It seems very unlikely but we had one case when we requested block
        // upload, provided correct original size, but no block was uploaded
        // and no hash was present (at least if it was present, backend would
        // fail the manifest validation).
        const expectedBlockCount = Math.ceil(file.size / FILE_CHUNK_SIZE) + (thumbnails ? thumbnails?.length : 0);
        if (buffer.uploadedBlockCount !== expectedBlockCount) {
            throw new Error('Some file parts failed to upload');
        }
        if (buffer.totalProcessedSize !== file.size) {
            throw new Error('Some file bytes failed to upload');
        }

        const [signature, exifInfo] = await Promise.all([
            signMessage(fileHash, [addressPrivateKey]),
            isForPhotos ? getExifInfo(file, mimeType) : undefined,
        ]);
        const photoDimensions = exifInfo ? getPhotoDimensions(exifInfo) : {};

        const { width, height, duration } = {
            width: media?.width || photoDimensions.width,
            height: media?.height || photoDimensions.height,
            duration: media?.duration,
        };

        const sha1 = arrayToHexString(sha1Digest);

        const [xattr] = await Promise.all([
            encryptFileExtendedAttributes(
                {
                    file,
                    media:
                        width && height
                            ? {
                                  width,
                                  height,
                                  duration,
                              }
                            : undefined,
                    digests: { sha1 },
                    ...(exifInfo ? getPhotoExtendedAttributes(exifInfo) : {}),
                },
                privateKey,
                addressPrivateKey
            ),
        ]);

        uploadWorker.postDone(
            signature,
            addressEmail,
            xattr,
            isForPhotos
                ? {
                      captureTime: getUnixTime(getCaptureDateTime(file, exifInfo?.exif)),
                      contentHash: sha1 ? await generateLookupHash(sha1, parentHashKey) : undefined,
                  }
                : undefined
        );
    };
    startUploadJobs(
        pauser,
        uploadingBlocksGenerator,
        (progress: number) => uploadWorker.postProgress(progress),
        (error: Error) => uploadWorker.postNetworkError(error),
        log
    )
        .then(finish)
        .catch((err) => uploadWorker.postError(err));
}

/**
 * createdBlocks is called as a result to postCreateBlocks.
 */
function createdBlocks(fileLinks: Link[], thumbnailLinks?: Link[]) {
    buffer.setAllBlockLinks({ fileLinks, thumbnailLinks });
}

function pause() {
    pauser.pause();
}

function resume() {
    pauser.resume();
}
