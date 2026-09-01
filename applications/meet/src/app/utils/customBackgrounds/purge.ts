import { clearPersistedCustomBackgroundId } from '@proton/meet/utils/customBackgroundStorage';
import { getBackgroundNamespace } from '@proton/meet/utils/customBackgrounds';
import { getPersistedGuestBackgroundId } from '@proton/meet/utils/guestBackgroundIdentity';
import { getPersistedSessions } from '@proton/shared/lib/authentication/persistedSessionStorage';
import isTruthy from '@proton/utils/isTruthy';

import { pruneOrphanBackgroundNamespaces, purgeBackgroundNamespace } from './cache/backgroundCache';
import { forgetBackgroundsFolderUid } from './drive/backgroundsFolder';

/** Drops one user's records on logout, mirroring Redux persist's `deleteStore(persistedSession.UserID)`. */
export const purgeUserBackgrounds = async (userId: string): Promise<void> => {
    const namespace = getBackgroundNamespace({ isGuest: false, userId });

    if (!namespace) {
        return;
    }

    clearPersistedCustomBackgroundId(namespace);
    forgetBackgroundsFolderUid(namespace);
    await purgeBackgroundNamespace(namespace);
};

/**
 * Catches sessions removed while Meet was closed, so their logout listener never ran, and every guest
 * session but this tab's own, which is the only one whose records are still readable.
 */
export const pruneOrphanBackgroundCaches = async (): Promise<void> => {
    const liveNamespaces = [
        ...getPersistedSessions().map(({ UserID }) => getBackgroundNamespace({ isGuest: false, userId: UserID })),
        getBackgroundNamespace({ isGuest: true, guestId: getPersistedGuestBackgroundId() }),
    ].filter(isTruthy);

    await pruneOrphanBackgroundNamespaces(liveNamespaces);
};
