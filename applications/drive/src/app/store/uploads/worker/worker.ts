import * as openpgp from 'openpgp';
import { OpenPGPKey, SessionKey } from 'pmcrypto';
import { init as initPmcrypto } from 'pmcrypto/lib/pmcrypto';

import { mergeUint8Arrays } from '@proton/shared/lib/helpers/array';
import { sign as signMessage } from '@proton/shared/lib/keys/driveKeys';

import { ecryptFileExtendedAttributes } from '../../links';
import { EncryptedBlock, EncryptedThumbnailBlock, Link } from '../interface';
import { UploadWorker } from '../workerController';
import { getErrorString } from '../utils';

import { Pauser } from './pauser';
import UploadWorkerBuffer from './buffer';
import generateEncryptedBlocks from './encryption';
import startUploadJobs from './upload';

initPmcrypto(openpgp);

// eslint-disable-next-line no-restricted-globals
const uploadWorker = new UploadWorker(self as any, { start, createdBlocks, pause, resume });

const pauser = new Pauser();
const buffer = new UploadWorkerBuffer();

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
    thumbnailData: Uint8Array | undefined,
    addressPrivateKey: OpenPGPKey,
    addressEmail: string,
    privateKey: OpenPGPKey,
    sessionKey: SessionKey
) {
    buffer
        .feedEncryptedBlocks(generateEncryptedBlocks(file, thumbnailData, addressPrivateKey, privateKey, sessionKey))
        .catch((err) => uploadWorker.postError(getErrorString(err)));

    buffer.runBlockLinksCreation((blocks: EncryptedBlock[], thumbnailBlock?: EncryptedThumbnailBlock) => {
        uploadWorker.postCreateBlocks(blocks, thumbnailBlock);
    });

    const uploadingBlocksGenerator = buffer.generateUploadingBlocks();
    const finish = async () => {
        const fileHash = mergeUint8Arrays(buffer.blockHashes);
        const [signature, xattr] = await Promise.all([
            signMessage(fileHash, [addressPrivateKey]),
            ecryptFileExtendedAttributes(file, privateKey, addressPrivateKey),
        ]);
        uploadWorker.postDone(buffer.blockTokens, signature, addressEmail, xattr);
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
