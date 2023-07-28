import { Sha1 } from '@openpgp/asmcrypto.js/dist_es8/hash/sha1/sha1';
import { getUnixTime } from 'date-fns';

import { PrivateKeyReference, SessionKey } from '@proton/crypto';
import { arrayToHexString } from '@proton/crypto/lib/utils';
import { isSVG } from '@proton/shared/lib/helpers/mimetype';
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
import { EncryptedBlock, EncryptedThumbnailBlock, Link, VerificationData } from '../interface';
import { ThumbnailData } from '../thumbnail';
import { getErrorString } from '../utils';
import { UploadWorker } from '../workerController';
import UploadWorkerBuffer from './buffer';
import generateEncryptedBlocks from './encryption';
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
    mimeType: string,
    isPhoto: boolean,
    thumbnailData: ThumbnailData | undefined,
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
                thumbnailData?.thumbnailData,
                addressPrivateKey,
                privateKey,
                sessionKey,
                uploadWorker.postNotifySentry,
                hashInstance,
                verifier
            )
        )
        .catch((err) => uploadWorker.postError(getErrorString(err)));

    buffer.runBlockLinksCreation((blocks: EncryptedBlock[], thumbnailBlock?: EncryptedThumbnailBlock) => {
        uploadWorker.postCreateBlocks(blocks, thumbnailBlock);
    });

    const uploadingBlocksGenerator = buffer.generateUploadingBlocks();
    const finish = async () => {
        const fileHash = buffer.hash;
        const sha1Digest = hashInstance.finish().result;

        const [signature, exifInfo] = await Promise.all([
            signMessage(fileHash, [addressPrivateKey]),
            isPhoto && !isSVG(mimeType)
                ? await file.arrayBuffer().then((buffer) => {
                      // In case of error with return empty exif
                      try {
                          return getExifInfo(buffer);
                      } catch (err) {
                          return {};
                      }
                  })
                : {},
        ]);

        const photoDimensions = exifInfo ? getPhotoDimensions(exifInfo) : {};

        const { width, height } = {
            width: thumbnailData?.originalWidth || photoDimensions.width,
            height: thumbnailData?.originalHeight || photoDimensions.height,
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
                              }
                            : undefined,
                    digests: sha1
                        ? {
                              sha1,
                          }
                        : undefined,
                    ...getPhotoExtendedAttributes(exifInfo),
                },
                privateKey,
                addressPrivateKey
            ),
        ]);

        uploadWorker.postDone(
            signature,
            addressEmail,
            xattr,
            isPhoto
                ? {
                      captureTime: getUnixTime(getCaptureDateTime(file, exifInfo.exif)),
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
function createdBlocks(fileLinks: Link[], thumbnailLink?: Link) {
    const links = thumbnailLink ? [thumbnailLink, ...fileLinks] : fileLinks;
    buffer.setBlockLinks(links);
}

function pause() {
    pauser.pause();
}

function resume() {
    pauser.resume();
}
