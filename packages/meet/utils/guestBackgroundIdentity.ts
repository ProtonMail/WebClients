import { getItem, setItem } from '@proton/shared/lib/helpers/sessionStorage';

const GUEST_BACKGROUND_ID_KEY = 'meet.backgrounds.guestId';

/** Scoped to the tab, like the unauthenticated session UID and the key the records are encrypted to. */
export const getPersistedGuestBackgroundId = (): string | undefined => getItem(GUEST_BACKGROUND_ID_KEY) ?? undefined;

/** Minted on demand, so a browser that never caches anything stays unmarked. */
export const getOrCreateGuestBackgroundId = (): string => {
    const stored = getPersistedGuestBackgroundId();

    if (stored) {
        return stored;
    }

    const id = crypto.randomUUID();

    setItem(GUEST_BACKGROUND_ID_KEY, id);

    return id;
};
