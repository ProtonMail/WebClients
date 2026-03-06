import type { RoomVariant } from './RoomForm';

const ROOM_VARIANTS: RoomVariant[] = ['purple', 'orange', 'blue', 'green', 'red'];

/**
 * Returns a deterministic variant for a given room ID.
 * The same ID always returns the same variant.
 */
export const getRoomVariantFromId = (id: string | undefined): RoomVariant => {
    if (id === undefined || id === '') {
        return ROOM_VARIANTS[0]; // default to purple
    }
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = (hash << 5) - hash + id.charCodeAt(i);
        hash = hash >>> 0;
    }
    const index = Math.abs(hash) % ROOM_VARIANTS.length;
    return ROOM_VARIANTS[index];
};
