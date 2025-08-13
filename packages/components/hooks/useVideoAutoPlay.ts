import { useCallback, useEffect, useRef, useState } from 'react';

import useFlag from '@proton/unleash/useFlag';

const hasUserActivation = (nav: Navigator): nav is Navigator & { userActivation: { hasBeenActive: boolean } } => {
    return 'userActivation' in nav && nav.userActivation !== undefined;
};

const detectPriorUserInteraction = () => {
    if (hasUserActivation(navigator) && navigator.userActivation.hasBeenActive) {
        return true;
    }

    return false;
};

/**
 * Hook for managing video autoplay functionality with tab visibility detection.
 *
 * Features:
 * - Only autoplays when the tab is active
 * - Detects prior user interactions to determine muted/unmuted autoplay
 * - Uses browser's user activation API for reliable interaction detection
 *
 * @returns Object containing video props and ref, or undefined if feature flag is disabled
 * @returns {Object} videoRef - React ref for the video element
 * @returns {Function} handleCanPlay - Handler for video canplay event
 * @returns {boolean} autoPlay - Always false (manual autoplay control)
 * @returns {boolean} muted - True if no prior user interaction detected
 */
export const useVideoAutoPlay = () => {
    const isVideoAutoPlayEnabled = useFlag('DriveWebVideoAutoPlay');
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isTabActive, setIsTabActive] = useState(!document.hidden);
    const hasUserInteracted = detectPriorUserInteraction();
    const [hasAttemptedAutoplay, setHasAttemptedAutoplay] = useState(false);

    useEffect(() => {
        if (!isVideoAutoPlayEnabled) {
            return;
        }

        const handleVisibilityChange = () => {
            setIsTabActive(!document.hidden);
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isVideoAutoPlayEnabled]);

    const attemptAutoplay = useCallback(async () => {
        if (!videoRef.current || !isTabActive || hasAttemptedAutoplay) {
            return;
        }

        const video = videoRef.current;
        setHasAttemptedAutoplay(true);

        try {
            if (hasUserInteracted) {
                video.muted = false;
                await video.play();
            } else {
                video.muted = true;
                await video.play();
            }
        } catch (error) {
            // Softly catching the error, as the consequence will be that the user have to start play manual
            // eslint-disable-next-line no-console
            console.warn('Autoplay failed:', error);
        }
    }, [isTabActive, hasUserInteracted, hasAttemptedAutoplay]);

    const handleCanPlay = useCallback(() => {
        if (isVideoAutoPlayEnabled && isTabActive && !hasAttemptedAutoplay) {
            void attemptAutoplay();
        }
    }, [isVideoAutoPlayEnabled, isTabActive, hasAttemptedAutoplay, attemptAutoplay]);

    if (!isVideoAutoPlayEnabled) {
        return undefined;
    }

    return {
        videoRef,
        handleCanPlay,
        muted: !hasUserInteracted,
    };
};
