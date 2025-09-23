import { useCallback, useRef } from 'react';

import { type Share, type ShareWithKey, useDefaultShare } from '../../store';

/**
 * @deprecated
 * Provides stable function references for useDefaultShare functions
 * These functions are safe to use in dependency arrays without causing infinite re-renders.
 *
 * This hook is not meant to be used long-term but only during sdk transition period.
 */
export const useStableDefaultShare = () => {
    const { getDefaultShare, getDefaultShareAddressEmail, getDefaultPhotosShare, isShareAvailable } = useDefaultShare();

    const getDefaultShareRef = useRef(getDefaultShare);
    const getDefaultShareAddressEmailRef = useRef(getDefaultShareAddressEmail);
    const getDefaultPhotosShareRef = useRef(getDefaultPhotosShare);
    const isShareAvailableRef = useRef(isShareAvailable);

    getDefaultShareRef.current = getDefaultShare;
    getDefaultShareAddressEmailRef.current = getDefaultShareAddressEmail;
    getDefaultPhotosShareRef.current = getDefaultPhotosShare;
    isShareAvailableRef.current = isShareAvailable;

    const stableGetDefaultShare = useCallback(
        (abortSignal?: AbortSignal): Promise<ShareWithKey> => getDefaultShareRef.current(abortSignal),
        []
    );

    const stableGetDefaultShareAddressEmail = useCallback(
        (abortSignal?: AbortSignal): Promise<string> => getDefaultShareAddressEmailRef.current(abortSignal),
        []
    );

    const stableGetDefaultPhotosShare = useCallback(
        (abortSignal?: AbortSignal, force?: boolean): Promise<ShareWithKey | undefined> =>
            getDefaultPhotosShareRef.current(abortSignal, force),
        []
    );

    const stableIsShareAvailable = useCallback(
        (abortSignal: AbortSignal, shareId: string): Promise<Share | undefined> =>
            isShareAvailableRef.current(abortSignal, shareId),
        []
    );

    return {
        getDefaultShare: stableGetDefaultShare,
        getDefaultShareAddressEmail: stableGetDefaultShareAddressEmail,
        getDefaultPhotosShare: stableGetDefaultPhotosShare,
        isShareAvailable: stableIsShareAvailable,
    };
};
