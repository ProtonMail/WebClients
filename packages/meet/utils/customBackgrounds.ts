import type { BackgroundEffect } from '../store/slices/backgroundSlice';
import type { VirtualBackgroundSource } from './virtualBackgrounds';
import { getVirtualBackgroundSource, isVirtualBackgroundId } from './virtualBackgrounds';

const CUSTOM_BACKGROUND_PREFIX = 'custom:';

export const MAX_BACKGROUNDS_PER_NAMESPACE = 20;

/** Identified by cache record ID; the prefix separates it from the preset IDs in the same union. */
export type CustomBackgroundEffect = `custom:${string}`;

export const toCustomBackgroundEffect = (recordId: string): CustomBackgroundEffect =>
    `${CUSTOM_BACKGROUND_PREFIX}${recordId}`;

export const isCustomBackgroundEffect = (value: unknown): value is CustomBackgroundEffect =>
    typeof value === 'string' &&
    value.startsWith(CUSTOM_BACKGROUND_PREFIX) &&
    value.length > CUSTOM_BACKGROUND_PREFIX.length;

export const getCustomBackgroundRecordId = (value: unknown): string | null =>
    isCustomBackgroundEffect(value) ? value.slice(CUSTOM_BACKGROUND_PREFIX.length) : null;

const GUEST_BACKGROUND_NAMESPACE_PREFIX = 'guest.';

/**
 * Keyed on the user ID, not the local ID: local IDs are session slots, so re-logging in can land on a
 * different one and orphan the cached records. A guest without an ID of its own gets no namespace
 * rather than a shared one.
 */
export const getBackgroundNamespace = ({
    isGuest,
    userId,
    guestId,
}: {
    isGuest: boolean;
    userId?: string;
    guestId?: string;
}): string | undefined => {
    if (isGuest || !userId) {
        return guestId ? `${GUEST_BACKGROUND_NAMESPACE_PREFIX}${guestId}` : undefined;
    }

    return `user.${userId}`;
};

export const isGuestBackgroundNamespace = (namespace: string) =>
    namespace.startsWith(GUEST_BACKGROUND_NAMESPACE_PREFIX);

export type CustomBackgroundSourceResolver = (recordId: string) => Promise<VirtualBackgroundSource | null>;

let customResolver: CustomBackgroundSourceResolver | undefined;

export const registerCustomBackgroundSourceResolver = (resolver: CustomBackgroundSourceResolver) => {
    customResolver = resolver;

    return () => {
        if (customResolver === resolver) {
            customResolver = undefined;
        }
    };
};

export const resolveBackgroundSource = async (effect: BackgroundEffect): Promise<VirtualBackgroundSource | null> => {
    if (isVirtualBackgroundId(effect)) {
        return getVirtualBackgroundSource(effect);
    }

    const recordId = getCustomBackgroundRecordId(effect);

    if (!recordId || !customResolver) {
        return null;
    }

    return customResolver(recordId);
};
