import { CryptoProxy } from '@proton/crypto';

import { usePreventLeave } from '@proton/components';
import runInQueue from '@proton/shared/lib/helpers/runInQueue';
import chunk from '@proton/utils/chunk';

import { BATCH_REQUEST_SIZE, MAX_THREADS_PER_REQUEST, RESPONSE_CODE } from '@proton/shared/lib/drive/constants';
import { queryMoveLink } from '@proton/shared/lib/api/drive/share';
import {
    queryTrashLinks,
    queryRestoreLinks,
    queryEmptyTrashOfShare,
    queryDeleteTrashedLinks,
    queryDeleteChildrenLinks,
} from '@proton/shared/lib/api/drive/link';
import { RestoreFromTrashResult } from '@proton/shared/lib/interfaces/drive/restore';
import { generateLookupHash, encryptPassphrase } from '@proton/shared/lib/keys/driveKeys';
import { getDecryptedSessionKey } from '@proton/shared/lib/keys/drivePassphrase';

import { useDebouncedRequest } from '../_api';
import { useDriveCrypto } from '../_crypto';
import { useDriveEventManager } from '../_events';
import { ValidationError } from '../_utils';
import useLink from './useLink';
import useLinks from './useLinks';
import useLinksState from './useLinksState';

const INVALID_REQUEST_ERROR_CODES = [RESPONSE_CODE.ALREADY_EXISTS, RESPONSE_CODE.INVALID_REQUIREMENT];

/**
 * useLinksActions provides actions for manipulating with links in batches.
 */
export default function useLinksActions() {
    const { preventLeave } = usePreventLeave();
    const debouncedRequest = useDebouncedRequest();
    const events = useDriveEventManager();
    const { getLink, getLinkPassphraseAndSessionKey, getLinkPrivateKey, getLinkHashKey } = useLink();
    const { getLinks } = useLinks();
    const { lockLinks, unlockLinks, lockTrash } = useLinksState();
    const { getPrimaryAddressKey } = useDriveCrypto();

    /**
     * withLinkLock is helper to lock provided `linkIds` before the action done
     * using `callback`, and ensure links are unlocked after its done no matter
     * the result of the action.
     */
    const withLinkLock = async <T>(shareId: string, linkIds: string[], callback: () => Promise<T>): Promise<T> => {
        lockLinks(shareId, linkIds);
        try {
            return await callback();
        } finally {
            await events.pollShare(shareId);
            unlockLinks(shareId, linkIds);
        }
    };

    const moveLink = async (abortSignal: AbortSignal, shareId: string, newParentLinkId: string, linkId: string) => {
        const [
            link,
            { passphrase, passphraseSessionKey },
            newParentPrivateKey,
            newParentHashKey,
            { privateKey: addressKey, address },
        ] = await Promise.all([
            getLink(abortSignal, shareId, linkId),
            getLinkPassphraseAndSessionKey(abortSignal, shareId, linkId),
            getLinkPrivateKey(abortSignal, shareId, newParentLinkId),
            getLinkHashKey(abortSignal, shareId, newParentLinkId),
            getPrimaryAddressKey(),
        ]);

        const [currentParentPrivateKey, Hash, { NodePassphrase, NodePassphraseSignature }] = await Promise.all([
            getLinkPrivateKey(abortSignal, shareId, link.parentLinkId),
            generateLookupHash(link.name, newParentHashKey),
            encryptPassphrase(newParentPrivateKey, addressKey, passphrase, passphraseSessionKey),
        ]);

        const sessionKeyName = await getDecryptedSessionKey({
            data: link.encryptedName,
            privateKeys: currentParentPrivateKey,
        });
        const { message: encryptedName } = await CryptoProxy.encryptMessage({
            textData: link.name,
            stripTrailingSpaces: true,
            sessionKey: sessionKeyName,
            encryptionKeys: newParentPrivateKey,
            signingKeys: addressKey,
        });

        await debouncedRequest(
            queryMoveLink(shareId, linkId, {
                Name: encryptedName,
                Hash,
                ParentLinkID: newParentLinkId,
                NodePassphrase,
                NodePassphraseSignature,
                SignatureAddress: address.Email,
            })
        );
        const originalParentId = link.parentLinkId;
        return originalParentId;
    };

    const moveLinks = async (abortSignal: AbortSignal, shareId: string, linkIds: string[], newParentLinkId: string) => {
        return withLinkLock(shareId, linkIds, async () => {
            const originalParentIds: { [linkId: string]: string } = {};
            const successes: string[] = [];
            const failures: { [linkId: string]: any } = {};

            const moveQueue = linkIds.map((linkId) => async () => {
                return moveLink(abortSignal, shareId, newParentLinkId, linkId)
                    .then((originalParentId) => {
                        successes.push(linkId);
                        originalParentIds[linkId] = originalParentId;
                    })
                    .catch((error) => {
                        failures[linkId] = error;
                    });
            });

            await preventLeave(runInQueue(moveQueue, MAX_THREADS_PER_REQUEST));
            return { successes, failures, originalParentIds };
        });
    };

    /**
     * batchHelper makes easier to do any action with many links in several
     * batches to make sure API can handle it (to not send thousands of links
     * in one request), all run in parallel (up to a reasonable limit).
     */
    const batchHelper = async <T>(
        abortSignal: AbortSignal,
        shareId: string,
        linkIds: string[],
        query: (batchLinkIds: string[]) => any
    ) => {
        return withLinkLock(shareId, linkIds, async () => {
            const responses: { batchLinkIds: string[]; response: T }[] = [];
            const successes: string[] = [];
            const failures: { [linkId: string]: any } = {};

            const batches = chunk(linkIds, BATCH_REQUEST_SIZE);
            const queue = batches.map(
                (batchLinkIds) => () =>
                    debouncedRequest<T>(query(batchLinkIds), abortSignal)
                        .then((response) => {
                            responses.push({ batchLinkIds, response });
                            batchLinkIds.forEach((linkId) => successes.push(linkId));
                        })
                        .catch((error) => {
                            batchLinkIds.forEach((linkId) => (failures[linkId] = error));
                        })
            );
            await preventLeave(runInQueue(queue, MAX_THREADS_PER_REQUEST));
            return {
                responses,
                successes,
                failures,
            };
        });
    };

    const trashLinks = async (abortSignal: AbortSignal, shareId: string, parentLinkId: string, linkIds: string[]) => {
        return batchHelper(abortSignal, shareId, linkIds, (batchLinkIds) =>
            queryTrashLinks(shareId, parentLinkId, batchLinkIds)
        );
    };

    const restoreLinks = async (abortSignal: AbortSignal, shareId: string, linkIds: string[]) => {
        // Make sure to restore the most freshly trashed links first to ensure
        // the potential parents are restored first because it is not possible
        // to restore child if the parent stays in the trash.
        // If user does not select the parent anyway, it is fine, it will just
        // show error notification that some link(s) were not restored.
        const links = await getLinks(abortSignal, shareId, linkIds);
        const sortedLinks = links.sort((a, b) => (b.trashed || 0) - (a.trashed || 0));
        const sortedLinkIds = sortedLinks.map(({ linkId }) => linkId);

        return batchHelper<RestoreFromTrashResult>(abortSignal, shareId, sortedLinkIds, (batchLinkIds) =>
            queryRestoreLinks(shareId, batchLinkIds)
        ).then(({ responses, failures }) => {
            const successes: string[] = [];
            responses.forEach(({ batchLinkIds, response }) => {
                response.Responses.forEach(({ Response }, index) => {
                    const linkId = batchLinkIds[index];
                    if (!Response.Error) {
                        successes.push(linkId);
                    } else if (INVALID_REQUEST_ERROR_CODES.includes(Response.Code)) {
                        failures[linkId] = new ValidationError(Response.Error);
                    } else {
                        failures[linkId] = Response.Error;
                    }
                });
            });

            return { successes, failures };
        });
    };

    const deleteChildrenLinks = async (
        abortSignal: AbortSignal,
        shareId: string,
        parentLinkId: string,
        linkIds: string[]
    ) => {
        return batchHelper(abortSignal, shareId, linkIds, (batchLinkIds) =>
            queryDeleteChildrenLinks(shareId, parentLinkId, batchLinkIds)
        );
    };

    const deleteTrashedLinks = async (abortSignal: AbortSignal, shareId: string, linkIds: string[]) => {
        return batchHelper(abortSignal, shareId, linkIds, (batchLinkIds) =>
            queryDeleteTrashedLinks(shareId, batchLinkIds)
        );
    };

    const deleteTrash = async (abortSignal: AbortSignal, shareId: string) => {
        lockTrash(shareId);
        await debouncedRequest(queryEmptyTrashOfShare(shareId), abortSignal);
        await events.pollShare(shareId);
    };

    return {
        moveLinks,
        trashLinks,
        restoreLinks,
        deleteChildrenLinks,
        deleteTrashedLinks,
        deleteTrash,
    };
}
