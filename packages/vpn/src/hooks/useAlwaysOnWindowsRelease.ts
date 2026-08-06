import { useVariant } from '@proton/unleash/useVariant';

/**
 * Reads the Windows client version that first enforces the Always-on VPN device profile from the
 * `B2BAlwaysOnWindowsRelease` flag — its `version` variant carries the version as its payload.
 *
 * Returns `undefined` when the flag is off, or when it is on with no usable payload, so callers can
 * leave the version out of the UI altogether rather than advertise a version we can't name.
 */
export const useAlwaysOnWindowsRelease = (): string | undefined => {
    const variant = useVariant('B2BAlwaysOnWindowsRelease');

    if (variant.name !== 'version') {
        return undefined;
    }

    return variant.payload?.value?.trim() || undefined;
};
