import { useState } from 'react';

import { useRoomContext } from '@livekit/components-react';
import { RemoteTrackPublication } from 'livekit-client';
import { c } from 'ttag';

import { IcArrowsRotate } from '@proton/icons/icons/IcArrowsRotate';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectIsLocalScreenShare } from '@proton/meet/store/slices/screenShareStatusSlice';
import { isSafari } from '@proton/shared/lib/helpers/browser';
import { wait } from '@proton/shared/lib/helpers/promise';
import { useFlag } from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import { SecurityShield } from '../../../../atoms/SecurityShield/SecurityShield';
import { useScreenShareLabel } from '../../../../hooks/screenShare/useScreenShareLabel';
import { useScreenShareVideo } from '../../../../hooks/screenShare/useScreenShareVideo';
import { findScreenShare } from '../../../../utils/findScreenShare';

export const ScreenShareView = ({ isCompact = false }: { isCompact?: boolean }) => {
    const showReloadTrackButton = useFlag('MeetShowReloadTrackButton');

    const room = useRoomContext();

    const videoRef = useScreenShareVideo();

    const screenShareLabel = useScreenShareLabel();

    const [isRefreshingScreenShare, setIsRefreshingScreenShare] = useState(false);

    const isLocalScreenShare = useMeetSelector(selectIsLocalScreenShare);

    const handleRefreshScreenShareTrack = async () => {
        const publication = findScreenShare(room)?.publication;

        if (isRefreshingScreenShare || !(publication instanceof RemoteTrackPublication)) {
            return;
        }

        setIsRefreshingScreenShare(true);
        try {
            const wasEnabled = publication.isEnabled;

            if (publication.isSubscribed) {
                publication.setSubscribed(false);
                await wait(isSafari() ? 500 : 200);
                publication.setSubscribed(true);
                await wait(isSafari() ? 500 : 200);
            }

            publication.setEnabled(wasEnabled);
            await wait(isSafari() ? 200 : 50);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to refresh screen share track', error);
        } finally {
            setIsRefreshingScreenShare(false);
        }
    };

    return (
        <div className="w-full h-full relative">
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video ref={videoRef} className="screen-share-video w-full h-full block object-contain" playsInline />
            {!isCompact && (
                <div
                    aria-live="polite"
                    aria-atomic="true"
                    className="screen-share-label absolute bottom-custom left-custom flex rounded opacity-80"
                    style={{ '--bottom-custom': '1rem', '--left-custom': '1rem' }}
                >
                    <SecurityShield
                        title={c('Info').t`End-to-end encryption is active for screen share`}
                        size={3}
                        tooltipPlacement="top-start"
                    />
                    {screenShareLabel}
                </div>
            )}
            {!isLocalScreenShare && showReloadTrackButton && (
                <button
                    className={clsx(
                        'absolute user-select-none flex items-center justify-center w-custom h-custom bg-weak rounded-full border-none cursor-pointer transition-opacity',
                        isRefreshingScreenShare ? 'opacity-50 cursor-not-allowed' : 'opacity-80 hover:opacity-100'
                    )}
                    style={{
                        '--w-custom': isCompact ? '1.5rem' : '2rem',
                        '--h-custom': isCompact ? '1.5rem' : '2rem',
                        bottom: isCompact ? '0.5rem' : '1rem',
                        right: isCompact ? '0.5rem' : '1rem',
                        zIndex: 2,
                    }}
                    onClick={handleRefreshScreenShareTrack}
                    disabled={isRefreshingScreenShare}
                    aria-label={c('Action').t`Refresh screen share track`}
                    title={c('Info').t`Refresh screen share track`}
                >
                    <IcArrowsRotate
                        size={isCompact ? 3 : 4}
                        className={clsx(isRefreshingScreenShare && 'animate-spin')}
                    />
                </button>
            )}
        </div>
    );
};
