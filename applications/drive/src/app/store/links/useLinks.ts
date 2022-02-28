import runInQueue from '@proton/shared/lib/helpers/runInQueue';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { MAX_THREADS_PER_REQUEST } from '@proton/shared/lib/drive/constants';

import { isIgnoredError } from '../utils';
import { EncryptedLink, DecryptedLink } from './interface';
import useLink from './useLink';

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
                });
        });
        // Limit the decryption so the app does not freeze when loading big page.
        const results = await runInQueue(queue, MAX_THREADS_PER_REQUEST);
        const links = results.filter(isTruthy);

        return { links, errors };
    };

    const getLinks = async (abortSignal: AbortSignal, shareId: string, linkIds: string[]): Promise<DecryptedLink[]> => {
        const queue = linkIds.map((linkId) => async () => getLink(abortSignal, shareId, linkId));
        return runInQueue(queue, MAX_THREADS_PER_REQUEST);
    };

    return {
        decryptLinks,
        getLinks,
    };
}
