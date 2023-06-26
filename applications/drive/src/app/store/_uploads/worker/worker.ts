import { Sha1 } from '@openpgp/asmcrypto.js/dist_es8/hash/sha1/sha1';

import { PrivateKeyReference, SessionKey } from '@proton/crypto';
import { arrayToHexString } from '@proton/crypto/lib/utils';
import { generateContentKeys, generateNodeKeys, sign as signMessage } from '@proton/shared/lib/keys/driveKeys';

import { encryptFileExtendedAttributes } from '../../_links';
import { EncryptedBlock, EncryptedThumbnailBlock, Link } from '../interface';
import { ThumbnailData } from '../thumbnail';
import { getErrorString } from '../utils';
import { UploadWorker } from '../workerController';
import UploadWorkerBuffer from './buffer';
import generateEncryptedBlocks from './encryption';
import { Pauser } from './pauser';
import startUploadJobs from './upload';

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
    thumbnailData: ThumbnailData | undefined,
    addressPrivateKey: PrivateKeyReference,
    addressEmail: string,
    privateKey: PrivateKeyReference,
    sessionKey: SessionKey
) {
    const hashInstance = new Sha1();

    buffer
        .feedEncryptedBlocks(
            generateEncryptedBlocks(
                file,
                thumbnailData?.thumbnailData,
                addressPrivateKey,
                privateKey,
                sessionKey,
                (e) => uploadWorker.postNotifySentry(e),
                hashInstance
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

        const [signature, xattr] = await Promise.all([
            signMessage(fileHash, [addressPrivateKey]),
            encryptFileExtendedAttributes(
                {
                    file,
                    media:
                        thumbnailData?.originalWidth && thumbnailData?.originalHeight
                            ? {
                                  width: thumbnailData.originalWidth,
                                  height: thumbnailData.originalHeight,
                              }
                            : undefined,
                    digests: sha1Digest
                        ? {
                              sha1: arrayToHexString(sha1Digest),
                          }
                        : undefined,
                },
                privateKey,
                addressPrivateKey
            ),
        ]);
        uploadWorker.postDone(signature, addressEmail, xattr);
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
