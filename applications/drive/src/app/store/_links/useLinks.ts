import { MAX_THREADS_PER_REQUEST } from '@proton/shared/lib/drive/constants';
import runInQueue from '@proton/shared/lib/helpers/runInQueue';
import isTruthy from '@proton/utils/isTruthy';

import { isIgnoredError } from '../../utils/errorHandling';
import { DecryptedLink, EncryptedLink } from './interface';
import useLink from './useLink';

const generateCorruptDecryptedLink = (encryptedLink: EncryptedLink): DecryptedLink => ({
    encryptedName: encryptedLink.name,
    name: 'xxxxx',
    linkId: encryptedLink.linkId,
    createTime: encryptedLink.createTime,
    corruptedLink: true,
    activeRevision: encryptedLink.activeRevision,
    digests: { sha1: '' },
    hash: encryptedLink.hash,
    size: encryptedLink.size,
    fileModifyTime: 0,
    metaDataModifyTime: encryptedLink.metaDataModifyTime,
    isFile: encryptedLink.isFile,
    mimeType: encryptedLink.mimeType,
    hasThumbnail: encryptedLink.hasThumbnail,
    isShared: encryptedLink.isShared,
    parentLinkId: encryptedLink.parentLinkId,
    rootShareId: encryptedLink.rootShareId,
    signatureIssues: encryptedLink.signatureIssues,
    originalDimensions: {
        height: 0,
        width: 0,
    },
    trashed: encryptedLink.trashed,
});

export default function useLinks() {
    const { decryptLink, getLink } = useLink();

    const decryptLinks = async (
        abortSignal: AbortSignal,
        shareId: string,
        encryptedLinks: EncryptedLink[]
    ): Promise<{
        links: { encrypted: EncryptedLink; decrypted: DecryptedLink }[];
        errors: any[];
    }> => {
        let errors: any[] = [];
        const queue = encryptedLinks.map((encrypted) => async () => {
            if (abortSignal.aborted) {
                return;
            }
            return decryptLink(abortSignal, shareId, encrypted)
                .then((decrypted) => ({ encrypted, decrypted }))
                .catch((err) => {
                    if (!isIgnoredError(err)) {
                        errors.push(err);
                    }

                    if (err.message.startsWith('Error decrypting')) {
                        return { encrypted, decrypted: generateCorruptDecryptedLink(encrypted) };
                    }
                });
        });
        // Limit the decryption so the app does not freeze when loading big page.
        const results = await runInQueue(queue, MAX_THREADS_PER_REQUEST);
        const links = results.filter(isTruthy);

        return { links, errors };
    };

    const getLinks = async (
        abortSignal: AbortSignal,
        ids: { linkId: string; shareId: string }[]
    ): Promise<DecryptedLink[]> => {
        const queue = ids.map(
            ({ linkId, shareId }) =>
                async () =>
                    getLink(abortSignal, shareId, linkId)
        );
        return runInQueue(queue, MAX_THREADS_PER_REQUEST);
    };

    return {
        decryptLinks,
        getLinks,
    };
}
