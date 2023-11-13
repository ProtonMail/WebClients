import { Sha1 } from '@openpgp/asmcrypto.js/dist_es8/hash/sha1/sha1';
import { getUnixTime } from 'date-fns';

import { PrivateKeyReference, SessionKey } from '@proton/crypto';
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
import { EncryptedBlock, Link, ThumbnailEncryptedBlock, VerificationData } from '../interface';
import { Media, ThumbnailInfo } from '../media';
import { getErrorString } from '../utils';
import { UploadWorker } from '../workerController';
import UploadWorkerBuffer from './buffer';
import { generateEncryptedBlocks, generateThumbnailEncryptedBlocks } from './encryption';
import { Pauser } from './pauser';
import startUploadJobs from './upload';
import { createVerifier } from './verifier';

// eslint-disable-next-line no-restricted-globals
const uploadWorker = new UploadWorker(self as any, { generateKeys, start, createdBlocks, pause, resume });

const pauser = new Pauser();
const buffer = new UploadWorkerBuffer();

async function generateKeys(addressPrivateKey: PrivateKeyReference, parentPrivateKey: PrivateKeyReference) {
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
            uploadWorker.postError('Could not generate file keys');
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
        uploadWorker.postError(getErrorString(err));
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
    const hashInstance = new Sha1();
    const verifier = createVerifier(verificationData);

    buffer
        .feedEncryptedBlocks(
            generateEncryptedBlocks(
                file,
                addressPrivateKey,
                privateKey,
                sessionKey,
                uploadWorker.postNotifySentry,
                hashInstance,
                verifier
            ),
            thumbnails && generateThumbnailEncryptedBlocks(thumbnails, addressPrivateKey, sessionKey)
        )
        .catch((err) => uploadWorker.postError(getErrorString(err)));

    buffer.runBlockLinksCreation((blocks: EncryptedBlock[], thumbnailBlocks?: ThumbnailEncryptedBlock[]) => {
        uploadWorker.postCreateBlocks(blocks, thumbnailBlocks);
    });

    const uploadingBlocksGenerator = buffer.generateUploadingBlocks();
    const finish = async () => {
        const fileHash = buffer.hash;
        const sha1Digest = hashInstance.finish().result;

        // It seems very unlikely but we had one case when we requested block
        // upload, provided correct original size, but no block was uploaded
        // and no hash was present (at least if it was present, backend would
        // fail the manifest validation).
        const expectedBlockCount = Math.ceil(file.size / FILE_CHUNK_SIZE) + (thumbnails ? thumbnails?.length : 0);
        if (buffer.uploadedBlockCount !== expectedBlockCount) {
            throw new Error('Some file parts failed to upload');
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

        const sha1 = sha1Digest ? arrayToHexString(sha1Digest) : undefined;

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
                    digests: sha1
                        ? {
                              sha1,
                          }
                        : undefined,
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
        (error: string) => uploadWorker.postNetworkError(error)
    )
        .then(finish)
        .catch((err) => uploadWorker.postError(getErrorString(err)));
}

/**
 * createdBlocks is called as a result to postCreateBlocks.
 */
function createdBlocks(fileLinks: Link[], thumbnailLinks?: Link[]) {
    buffer.setFileBlockLinks(fileLinks);
    if (thumbnailLinks) {
        buffer.setThumbnailBlockLinks(thumbnailLinks);
    }
    buffer.requestingBlockLinks = false;
}

function pause() {
    pauser.pause();
}

function resume() {
    pauser.resume();
}
