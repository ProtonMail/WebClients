import { useEventManager } from 'react-components';

import useDriveCrypto from './useDriveCrypto';
import useDebouncedRequest from '../util/useDebouncedRequest';
import { LinkKeys, useDriveCache } from '../../components/DriveCache/DriveCacheProvider';
import { useDriveEventManager, ShareEvent } from '../../components/DriveEventManager/DriveEventManagerProvider';
import { LinkMeta } from '../../interfaces/link';
import { getSuccessfulSettled, logSettledErrors } from '../../utils/async';
import {
    getLinkKeysAsync,
    getShareKeysAsync,
    decryptLinkAsync,
    getLinkMetaAsync,
    decryptLinkPassphraseAsync,
} from '../../utils/drive/drive';
import { EVENT_TYPES } from '../../constants';

const { CREATE, DELETE, UPDATE_METADATA } = EVENT_TYPES;

function useEvents() {
    const cache = useDriveCache();
    const eventManager = useEventManager();
    const { getShareEventManager, createShareEventManager } = useDriveEventManager();
    const { getVerificationKeys, decryptSharePassphrase } = useDriveCrypto();
    const debouncedRequest = useDebouncedRequest();

    const handleEvents = (shareId: string) => async ({ Events = [] }: { Events: ShareEvent[] }) => {
        const getShareKeys = async (shareId: string) => {
            const keys = await getShareKeysAsync(
                debouncedRequest,
                cache,
                shareId,
                decryptSharePassphrase,
                (shareId: string) => {
                    const eventManager = getShareEventManager(shareId);
                    eventManager.subscribe(handleEvents(shareId));
                    return Promise.resolve();
                }
            );
            return keys;
        };

        const getLinkKeys = async (shareId: string, linkId: string): Promise<LinkKeys> => {
            const keys = await getLinkKeysAsync(
                // eslint-disable-next-line @typescript-eslint/no-use-before-define
                decryptLinkPassphrase,
                // eslint-disable-next-line @typescript-eslint/no-use-before-define
                getLinkMeta,
                cache,
                shareId,
                linkId
            );
            return keys;
        };

        const getLinkMeta = async (shareId: string, linkId: string): Promise<LinkMeta> => {
            const meta = await getLinkMetaAsync(debouncedRequest, getLinkKeys, getShareKeys, cache, shareId, linkId);
            return meta;
        };

        const decryptLinkPassphrase = (shareId: string, linkMeta: LinkMeta) => {
            return decryptLinkPassphraseAsync(shareId, getLinkKeys, getShareKeys, getVerificationKeys, linkMeta);
        };

        const decryptLink = async (meta: LinkMeta) => {
            const { privateKey } = meta.ParentLinkID
                ? await getLinkKeys(shareId, meta.ParentLinkID)
                : await getShareKeys(shareId);

            return decryptLinkAsync(meta, privateKey);
        };

        const isTrashedRestoredOrMoved = ({ LinkID, ParentLinkID, Trashed }: LinkMeta) => {
            const existing = cache.get.linkMeta(shareId, LinkID);
            return existing && (existing.Trashed !== Trashed || existing.ParentLinkID !== ParentLinkID);
        };

        const actions = Events.reduce(
            (actions, { EventType, Link }) => {
                if (EventType === DELETE) {
                    actions.delete.push(Link.LinkID);
                    return actions;
                }

                if (isTrashedRestoredOrMoved(Link)) {
                    actions.softDelete.push(Link.LinkID);
                }

                const decryptedLinkPromise = decryptLink(Link);

                if (EventType === CREATE) {
                    actions.create[Link.ParentLinkID] = [
                        ...(actions.create[Link.ParentLinkID] ?? []),
                        decryptedLinkPromise,
                    ];
                }

                if (EventType === UPDATE_METADATA) {
                    if (Link.Trashed) {
                        actions.trash.push(decryptedLinkPromise);
                    } else {
                        actions.update[Link.ParentLinkID] = [
                            ...(actions.update[Link.ParentLinkID] ?? []),
                            decryptedLinkPromise,
                        ];
                    }
                }

                return actions;
            },
            {
                delete: [] as string[],
                softDelete: [] as string[],
                trash: [] as Promise<LinkMeta>[],
                create: {} as { [parentId: string]: Promise<LinkMeta>[] },
                update: {} as { [parentId: string]: Promise<LinkMeta>[] },
            }
        );

        cache.delete.links(shareId, actions.delete);
        cache.delete.links(shareId, actions.softDelete, true);

        const trashPromise = Promise.allSettled(actions.trash)
            .then(getSuccessfulSettled)
            .then((trashMetas: LinkMeta[]) => cache.set.trashLinkMetas(trashMetas, shareId, 'unlisted'))
            .catch((e) => console.error(e));

        const createPromises = Object.entries(actions.create).map(async ([parentId, promises]) => {
            const metas = await Promise.allSettled(promises).then(getSuccessfulSettled);
            cache.set.childLinkMetas(metas, shareId, parentId, 'unlisted_create');
            cache.set.foldersOnlyLinkMetas(metas, shareId, parentId, 'unlisted_create');
        });

        const updatePromises = Object.entries(actions.update).map(async ([parentId, promises]) => {
            const metas = await Promise.allSettled(promises).then(getSuccessfulSettled);
            cache.set.childLinkMetas(metas, shareId, parentId, 'unlisted');
            cache.set.foldersOnlyLinkMetas(metas, shareId, parentId, 'unlisted');
        });

        await Promise.allSettled([
            trashPromise,
            Promise.allSettled(createPromises).then(logSettledErrors),
            Promise.allSettled(updatePromises).then(logSettledErrors),
        ]);
    };

    const subscribe = async (shareId: string) => {
        const eventManager = getShareEventManager(shareId) || (await createShareEventManager(shareId));
        eventManager.subscribe(handleEvents(shareId));
    };

    const call = (shareId: string): Promise<void> => {
        return getShareEventManager(shareId).call();
    };

    const callAll = (shareId: string) => Promise.all([eventManager.call(), call(shareId)]);

    return { subscribe, call, callAll };
}

export default useEvents;
