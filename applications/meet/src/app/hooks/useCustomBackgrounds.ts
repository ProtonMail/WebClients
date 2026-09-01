import { useEffect, useMemo, useRef } from 'react';

import { c } from 'ttag';

import { useGetUserKeys } from '@proton/account/userKeys/hooks';
import { selectUserKeys } from '@proton/account/userKeys/index';
import { useNotifications } from '@proton/app-context/useNotifications';
import { ValidationError } from '@proton/drive';
import { useMeetErrorReporting } from '@proton/meet/hooks/useMeetErrorReporting';
import { useMeetDispatch, useMeetSelector, useMeetStore } from '@proton/meet/store/hooks';
import {
    selectAppliedBackgroundEffect,
    selectPendingBackgroundEffect,
} from '@proton/meet/store/slices/backgroundSlice';
import type { CustomBackground } from '@proton/meet/store/slices/customBackgroundsSlice';
import {
    reconcileCustomBackgrounds,
    removeCustomBackground,
    resetCustomBackgrounds,
    selectBackgroundNamespace,
    selectHasReachedCustomBackgroundLimit,
    setCustomBackgrounds,
    setIsAddingCustomBackground,
    setIsCustomBackgroundDriveUnavailable,
    upsertCustomBackground,
} from '@proton/meet/store/slices/customBackgroundsSlice';
import {
    selectGuestBackgroundId,
    selectIsGuest,
    selectUserId,
    setGuestBackgroundId,
} from '@proton/meet/store/slices/userSlice';
import {
    clearPersistedCustomBackgroundId,
    getPersistedCustomBackgroundId,
} from '@proton/meet/utils/customBackgroundStorage';
import { registerCustomBackgroundSourceResolver, toCustomBackgroundEffect } from '@proton/meet/utils/customBackgrounds';
import { getOrCreateGuestBackgroundId } from '@proton/meet/utils/guestBackgroundIdentity';
import type { VirtualBackgroundSource } from '@proton/meet/utils/virtualBackgrounds';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import { announcementMessages } from '../components/MeetingAnnouncer/messages';
import { useAnnounce } from '../components/MeetingAnnouncer/useAnnounce';
import { prepareBackground } from '../utils/customBackgrounds/backgroundPreview';
import {
    attachCachedBackgroundImage,
    deleteCachedBackground,
    getCachedBackgroundImage,
    initBackgroundCache,
    isBackgroundCacheReady,
    listCachedBackgrounds,
    putCachedBackground,
} from '../utils/customBackgrounds/cache/backgroundCache';
import { resolveBackgroundsFolderUid } from '../utils/customBackgrounds/drive/backgroundsFolder';
import type { DriveBackground, UploadedDriveBackground } from '../utils/customBackgrounds/drive/driveBackgrounds';
import {
    downloadDriveBackground,
    fetchDriveBackgroundPreviews,
    listDriveBackgrounds,
    trashDriveBackground,
    uploadDriveBackground,
} from '../utils/customBackgrounds/drive/driveBackgrounds';
import { isTransientDriveError } from '../utils/customBackgrounds/drive/driveErrors';
import { getRejectionMessage } from '../utils/customBackgrounds/messages';
import { createObjectUrlRegistry } from '../utils/customBackgrounds/objectUrlRegistry';
import { planReconciliation } from '../utils/customBackgrounds/reconcile';
import type { CachedBackground } from '../utils/customBackgrounds/types';
import {
    InvalidBackgroundError,
    sanitizeBackgroundName,
    validateBackgroundFile,
} from '../utils/customBackgrounds/validateBackground';
import { useInitDrive } from './useInitDrive';
import { useIsCustomBackgroundsEnabled } from './useIsCustomBackgroundsEnabled';
import { useStableCallback } from './useStableCallback';

export interface CustomBackgroundsActions {
    addBackground: (file: File) => Promise<void>;
    deleteBackground: (recordId: string) => Promise<void>;
    ensureLoaded: () => void;
}

export const useCustomBackgrounds = ({
    selectBackgroundEffect,
    appliedCustomBackgroundId,
}: {
    selectBackgroundEffect: (effect: ReturnType<typeof toCustomBackgroundEffect> | 'none') => Promise<void>;
    appliedCustomBackgroundId: string | null;
}): CustomBackgroundsActions => {
    const isEnabled = useIsCustomBackgroundsEnabled();
    const isGuest = useMeetSelector(selectIsGuest);
    const userId = useMeetSelector(selectUserId);
    const userKeys = useMeetSelector((state) => selectUserKeys(state).value);
    const getUserKeys = useGetUserKeys();
    // Everything Drive is behind `!isGuest`: a guest has no volume to read or write.
    useInitDrive(isEnabled && !isGuest);
    const store = useMeetStore();
    const dispatch = useMeetDispatch();
    const { createNotification } = useNotifications();
    const { reportMeetError } = useMeetErrorReporting();
    const announce = useAnnounce();

    const previewUrlsRef = useRef(createObjectUrlRegistry());
    const imageUrlsRef = useRef(createObjectUrlRegistry());
    const hasRestoredSelectionRef = useRef(false);
    const sessionRef = useRef<{ controller: AbortController; cacheLoaded: Promise<void> } | undefined>(undefined);
    const driveSyncRef = useRef<Promise<void> | undefined>(undefined);
    const hasRequestedLoadRef = useRef(false);

    const namespace = useMeetSelector(selectBackgroundNamespace);
    const guestBackgroundId = useMeetSelector(selectGuestBackgroundId);

    /**
     * Writes `meet.backgrounds.guestId` to sessionStorage on a miss, so it is kept out of the store
     * initializer: that runs on every load, and only browsers with the feature on should be marked.
     */
    useEffect(() => {
        if (isEnabled && !guestBackgroundId && (isGuest || !userId)) {
            dispatch(setGuestBackgroundId(getOrCreateGuestBackgroundId()));
        }
    }, [isEnabled, guestBackgroundId, isGuest, userId, dispatch]);

    useEffect(() => {
        if (isEnabled && !isGuest) {
            void getUserKeys().catch(noop);
        }
    }, [isEnabled, isGuest, getUserKeys]);

    const isCacheConfigurable = isEnabled && !!namespace && (isGuest || (!!userId && !!userKeys?.length));

    const toRenderable = useStableCallback(({ id, name, createdAt, preview }: CachedBackground): CustomBackground => ({
        id,
        name,
        createdAt,
        previewUrl: preview ? previewUrlsRef.current.set(id, preview) : undefined,
        isLoading: false,
    }));

    const renderCached = useStableCallback((cached: CachedBackground[]) => {
        dispatch(setCustomBackgrounds(cached.map(toRenderable)));
    });

    /** Rendered from the bytes in hand rather than read back, so a dropped cache write still draws. */
    const renderAdded = useStableCallback((added: CachedBackground) => {
        dispatch(upsertCustomBackground(toRenderable(added)));
    });

    /** Every trace of a record: its cache entry and both blob URLs minted from it. */
    const forgetBackground = useStableCallback(async (recordId: string) => {
        await deleteCachedBackground(recordId);
        previewUrlsRef.current.revoke(recordId);
        imageUrlsRef.current.revoke(recordId);
    });

    const removeBackground = useStableCallback(async (recordId: string) => {
        await forgetBackground(recordId);
        dispatch(removeCustomBackground(recordId));
    });

    const clearSelectionIfApplied = useStableCallback(async (recordId: string) => {
        if (appliedCustomBackgroundId === recordId) {
            await selectBackgroundEffect('none');
        }
    });

    const restorePersistedSelection = useStableCallback(async (cached: CachedBackground[]) => {
        if (hasRestoredSelectionRef.current) {
            return;
        }

        hasRestoredSelectionRef.current = true;

        const persistedId = getPersistedCustomBackgroundId(namespace);

        if (!persistedId) {
            return;
        }

        const state = store.getState();

        if (selectAppliedBackgroundEffect(state) !== 'none' || selectPendingBackgroundEffect(state) !== null) {
            return;
        }

        if (!cached.some(({ id }) => id === persistedId)) {
            // Only a cache that opened can say the record is gone; an empty listing from one that
            // never opened means unknown, and forgetting the choice over that would lose it for good.
            if (isBackgroundCacheReady()) {
                clearPersistedCustomBackgroundId(namespace);
            }

            return;
        }

        await selectBackgroundEffect(toCustomBackgroundEffect(persistedId));
    });

    const listFromDrive = useStableCallback(async (signal: AbortSignal) => {
        if (!namespace) {
            return null;
        }

        try {
            const folderUid = await resolveBackgroundsFolderUid({ namespace, create: false, signal });

            if (!folderUid) {
                return [];
            }

            return await listDriveBackgrounds({ folderUid, signal });
        } catch (error) {
            if (!signal.aborted && !isTransientDriveError(error)) {
                reportMeetError('Failed to list custom backgrounds from Drive', error);
            }

            return null;
        }
    });

    const reconcile = useStableCallback(
        async ({
            cached,
            listed,
            signal,
        }: {
            cached: CachedBackground[];
            listed: DriveBackground[];
            signal: AbortSignal;
        }) => {
            const { toFetch, toDelete } = planReconciliation({ cached, listed });

            if (!toFetch.length && !toDelete.length) {
                return;
            }

            // Placeholders so a background uploaded elsewhere shows while its thumbnail is fetched.
            dispatch(
                reconcileCustomBackgrounds({
                    removedIds: toDelete,
                    pending: toFetch.map(({ nodeUid, name, createdAt }) => ({
                        id: nodeUid,
                        name,
                        createdAt,
                        isLoading: true,
                    })),
                })
            );

            for (const id of toDelete) {
                await forgetBackground(id);

                if (!toFetch.some(({ nodeUid }) => nodeUid === id)) {
                    await clearSelectionIfApplied(id);
                }
            }

            const fetched: CachedBackground[] = [];

            if (toFetch.length) {
                const previews = await fetchDriveBackgroundPreviews({
                    nodeUids: toFetch.map(({ nodeUid }) => nodeUid),
                    signal,
                }).catch((error) => {
                    if (!signal.aborted && !isTransientDriveError(error)) {
                        reportMeetError('Failed to fetch custom background thumbnails', error);
                    }

                    return new Map<string, Uint8Array<ArrayBuffer>>();
                });

                fetched.push(
                    ...toFetch.map(({ nodeUid, revisionUid, name, createdAt }) => ({
                        id: nodeUid,
                        revisionUid,
                        name,
                        createdAt,
                        preview: previews.get(nodeUid),
                    }))
                );

                for (const background of fetched) {
                    await putCachedBackground(background);
                }
            }

            if (signal.aborted) {
                return;
            }

            // Composed from what is in hand rather than read back: a cache that never opened drops
            // every write, and reading it back would empty the picker.
            const byId = new Map([...cached, ...fetched].map((background) => [background.id, background]));

            renderCached(listed.map(({ nodeUid }) => byId.get(nodeUid)).filter(isTruthy));
        }
    );

    /** Local only, so joining a meeting pays nothing: Drive reconciles this on first open. */
    const loadFromCache = useStableCallback(async (signal: AbortSignal) => {
        const cached = await listCachedBackgrounds();

        if (signal.aborted) {
            return;
        }

        renderCached(cached);
        await restorePersistedSelection(cached);
    });

    /** Whether the listing ran to completion, which is what makes the sync worth doing only once. */
    const syncWithDrive = useStableCallback(async (signal: AbortSignal): Promise<boolean> => {
        // Read again rather than reusing the mount-time snapshot, which can be out of date by now.
        const [cached, listing] = await Promise.all([listCachedBackgrounds(), listFromDrive(signal)]);

        // Offline and deleted are indistinguishable here, so a failed listing prunes nothing.
        if (signal.aborted || !listing) {
            if (!signal.aborted) {
                dispatch(setIsCustomBackgroundDriveUnavailable(true));
            }

            return false;
        }

        dispatch(setIsCustomBackgroundDriveUnavailable(false));

        await reconcile({ cached, listed: listing, signal });

        return true;
    });

    const startDriveSync = useStableCallback(() => {
        const session = sessionRef.current;

        if (!hasRequestedLoadRef.current || !session || isGuest || driveSyncRef.current) {
            return;
        }

        driveSyncRef.current = (async () => {
            let synced = false;

            try {
                await session.cacheLoaded;

                if (session.controller.signal.aborted) {
                    return;
                }

                synced = await syncWithDrive(session.controller.signal);
            } catch (error) {
                if (!session.controller.signal.aborted) {
                    reportMeetError('Failed to load custom backgrounds', error);
                }
            }

            // A sync that never completed leaves nothing reconciled, so the next open retries.
            if (!synced && sessionRef.current === session) {
                driveSyncRef.current = undefined;
            }
        })();
    });

    useEffect(() => {
        if (!isCacheConfigurable || !namespace) {
            return;
        }

        const controller = new AbortController();
        // Nobody is guaranteed to await this, and every step reports its own failures already.
        const cacheLoaded = (async () => {
            await initBackgroundCache({ namespace, userKeys });

            if (!controller.signal.aborted) {
                await loadFromCache(controller.signal);
            }
        })().catch(noop);

        sessionRef.current = { controller, cacheLoaded };
        driveSyncRef.current = undefined;
        dispatch(setIsCustomBackgroundDriveUnavailable(false));

        // The picker only asks once, when it opens, so one that opened before there was a session to
        // load from — keys that had not landed yet — is served here instead.
        startDriveSync();

        return () => {
            controller.abort();
            sessionRef.current = undefined;
            driveSyncRef.current = undefined;
        };
    }, [isCacheConfigurable, namespace, userKeys, loadFromCache, startDriveSync, dispatch]);

    const ensureLoaded = useStableCallback(() => {
        hasRequestedLoadRef.current = true;

        startDriveSync();
    });

    useEffect(() => {
        const previews = previewUrlsRef.current;
        const images = imageUrlsRef.current;

        return () => {
            previews.revokeAll();
            images.revokeAll();
            // The store outlives this hook, and every preview URL in it has just been revoked.
            dispatch(resetCustomBackgrounds());
        };
    }, [dispatch]);

    /** Applying is the only path that needs full resolution: a cache miss downloads and caches it. */
    const resolveSource = useStableCallback(async (recordId: string): Promise<VirtualBackgroundSource | null> => {
        const existingUrl = imageUrlsRef.current.get(recordId);

        if (existingUrl) {
            return { imageUrl: existingUrl };
        }

        const cachedImage = await getCachedBackgroundImage(recordId);
        const cachedImageUrl = cachedImage ? imageUrlsRef.current.set(recordId, cachedImage) : undefined;

        if (cachedImageUrl) {
            return { imageUrl: cachedImageUrl };
        }

        // Cached bytes that no longer sniff as a supported image are dropped.
        if (cachedImage) {
            reportMeetError('A cached custom background is not a supported image');
            await deleteCachedBackground(recordId);
        }

        // A guest's image is written with the record, so a miss means it is gone for good.
        if (isGuest) {
            await clearSelectionIfApplied(recordId);

            return null;
        }

        try {
            const image = await downloadDriveBackground({ nodeUid: recordId });
            const imageUrl = imageUrlsRef.current.set(recordId, image);

            // Checked before caching, so a tampered file cannot settle into the cache.
            if (!imageUrl) {
                throw new InvalidBackgroundError(
                    'unsupportedType',
                    'The downloaded custom background is not a supported image'
                );
            }

            await attachCachedBackgroundImage(recordId, image);

            return { imageUrl };
        } catch (error) {
            if (!isTransientDriveError(error)) {
                reportMeetError('Failed to download a custom background', error);
            }

            // Both are permanent — the node is gone, or what came back is not an image anyone can
            // apply — so the record goes rather than downloading and reporting again on every try.
            if (error instanceof ValidationError || error instanceof InvalidBackgroundError) {
                await removeBackground(recordId);
                await clearSelectionIfApplied(recordId);
            }

            return null;
        }
    });

    useEffect(() => {
        return isEnabled ? registerCustomBackgroundSourceResolver(resolveSource) : undefined;
    }, [isEnabled, resolveSource]);

    const addBackground = useStableCallback(async (file: File) => {
        // Read at call time: a sync landing in between dates the count from the last render.
        if (selectHasReachedCustomBackgroundLimit(store.getState())) {
            createNotification({
                type: 'error',
                text: c('Error').t`You have reached the maximum number of custom backgrounds.`,
            });
            return;
        }

        dispatch(setIsAddingCustomBackground(true));

        // Local id: the Drive node UID only exists once the upload completes.
        const pendingId = `pending.${crypto.randomUUID()}`;

        try {
            // Ahead of everything else, so nothing that fails here is read, uploaded, cached or
            // applied. Its media type and name are the only ones used from here on.
            const mediaType = await validateBackgroundFile(file);
            const name = sanitizeBackgroundName(file.name, mediaType);

            dispatch(upsertCustomBackground({ id: pendingId, name, createdAt: Date.now(), isLoading: true }));

            const prepared = await prepareBackground(file);
            const image = new Uint8Array(await file.arrayBuffer()) as Uint8Array<ArrayBuffer>;
            const createdAt = Date.now();

            let uploaded: UploadedDriveBackground | undefined;

            if (!isGuest) {
                const folderUid = namespace
                    ? await resolveBackgroundsFolderUid({ namespace, create: true })
                    : undefined;

                if (!folderUid) {
                    throw new Error('Could not resolve the Meet backgrounds folder');
                }

                uploaded = await uploadDriveBackground({ folderUid, file, name, mediaType, prepared });
            }

            // A guest has no Drive volume to write to, so the record is keyed by a random UUID
            // rather than a node UID, and is never reconciled.
            const record: CachedBackground = {
                id: uploaded?.nodeUid ?? crypto.randomUUID(),
                revisionUid: uploaded?.revisionUid,
                createdAt,
                name: uploaded?.name ?? name,
                preview: prepared.preview,
            };

            const wasCached = await putCachedBackground({ ...record, image });

            // The cache is the only copy a guest has, so a dropped write loses the background.
            // Drive holds the original either way, so there it only costs a download.
            if (isGuest && !wasCached) {
                createNotification({
                    type: 'error',
                    text: c('Error').t`This background could not be saved in this browser.`,
                });

                return;
            }

            renderAdded(record);
            await selectBackgroundEffect(toCustomBackgroundEffect(record.id));
        } catch (error) {
            if (error instanceof InvalidBackgroundError) {
                createNotification({ type: 'error', text: getRejectionMessage(error.reason) });
            } else if (isTransientDriveError(error)) {
                createNotification({
                    type: 'error',
                    text: c('Error').t`Could not add this background. Check your connection and try again.`,
                });
            } else {
                reportMeetError('Failed to add a custom background', error);
                createNotification({
                    type: 'error',
                    text: c('Error').t`Could not add this background. Please try again.`,
                });
            }
        } finally {
            // A no-op on the paths that already re-rendered the list from the cache.
            dispatch(removeCustomBackground(pendingId));
            dispatch(setIsAddingCustomBackground(false));
        }
    });

    const deleteBackground = useStableCallback(async (recordId: string) => {
        try {
            // Trashed rather than permanently deleted, so the user can recover it.
            if (!isGuest) {
                await trashDriveBackground({ nodeUid: recordId });
            }

            await removeBackground(recordId);

            announce(announcementMessages.customBackgroundRemoved());
            await clearSelectionIfApplied(recordId);
        } catch (error) {
            if (isTransientDriveError(error)) {
                createNotification({
                    type: 'error',
                    text: c('Error').t`Could not remove this background. Check your connection and try again.`,
                });
            } else {
                reportMeetError('Failed to delete a custom background', error);
                createNotification({
                    type: 'error',
                    text: c('Error').t`Could not remove this background. Please try again.`,
                });
            }

            throw error;
        }
    });

    // Stable, so the picker does not re-render when the provider does.
    return useMemo(
        () => ({ addBackground, deleteBackground, ensureLoaded }),
        [addBackground, deleteBackground, ensureLoaded]
    );
};
