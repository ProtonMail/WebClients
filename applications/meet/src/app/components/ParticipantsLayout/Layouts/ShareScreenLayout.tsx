import { useState } from 'react';

import { useRoomContext } from '@livekit/components-react';
import { RemoteTrackPublication } from 'livekit-client';
import { c } from 'ttag';

import { IcArrowsRotate } from '@proton/icons/icons/IcArrowsRotate';
import { useMeetSelector } from '@proton/meet/store/hooks';
import {
    selectIsLocalScreenShare,
    selectScreenSharingParticipantName,
} from '@proton/meet/store/slices/screenShareStatusSlice';
import { selectIsSideBarOpen } from '@proton/meet/store/slices/uiStateSlice';
import { isSafari } from '@proton/shared/lib/helpers/browser';
import { wait } from '@proton/shared/lib/helpers/promise';
import { useFlag } from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import { SecurityShield } from '../../../atoms/SecurityShield/SecurityShield';
import { useScreenShareVideo } from '../../../hooks/screenShare/useScreenShareVideo';
import { useIsLargerThanMd } from '../../../hooks/useIsLargerThanMd';
import { findScreenShare } from '../../../utils/findScreenShare';
import { ParticipantSidebar } from './shared/ParticipantSidebar/ParticipantSidebar';

type ShareScreenLayoutProps = {
    participantSideBarOpen: boolean;
    setParticipantSideBarOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

enum ParticipantsSidebarSize {
    Big = 8,
    BigWithSidebar = 6,
    Small = 8,
    // Using 0 instead of removing the video element to avoid reinitializing the screenshare video
    SmallWithSidebar = 0,
}

const resolveParticipantsSidebarSize = (isSideBarOpen: boolean, isLargerThanMd: boolean) => {
    if (isLargerThanMd) {
        return isSideBarOpen ? ParticipantsSidebarSize.BigWithSidebar : ParticipantsSidebarSize.Big;
    }
    return isSideBarOpen ? ParticipantsSidebarSize.SmallWithSidebar : ParticipantsSidebarSize.Small;
};

export const ShareScreenLayout = ({ participantSideBarOpen, setParticipantSideBarOpen }: ShareScreenLayoutProps) => {
    const showReloadTrackButton = useFlag('MeetShowReloadTrackButton');

    const room = useRoomContext();

    const videoRef = useScreenShareVideo();

    const [isRefreshingScreenShare, setIsRefreshingScreenShare] = useState(false);

    const isLargerThanMd = useIsLargerThanMd();

    const isLocalScreenShare = useMeetSelector(selectIsLocalScreenShare);
    const isSideBarOpen = useMeetSelector(selectIsSideBarOpen);

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

    const presenterName = useMeetSelector(selectScreenSharingParticipantName);

    const screenShareLabel = isLocalScreenShare
        ? c('Info').t`${presenterName} (you) is presenting`
        : c('Info').t`${presenterName} is presenting`;

    return (
        <>
            <section
                aria-label={screenShareLabel}
                className="bg-strong h-full overflow-hidden mx-auto my-0 rounded relative shrink-1"
                style={{
                    flexGrow: resolveParticipantsSidebarSize(isSideBarOpen, isLargerThanMd),
                    flexBasis: 0,
                }}
            >
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <video ref={videoRef} className="screen-share-video w-full h-full block object-contain" playsInline />
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
                {!isLocalScreenShare && showReloadTrackButton && (
                    <button
                        className={clsx(
                            'absolute user-select-none flex items-center justify-center w-custom h-custom bg-weak rounded-full border-none cursor-pointer transition-opacity',
                            isRefreshingScreenShare ? 'opacity-50 cursor-not-allowed' : 'opacity-80 hover:opacity-100'
                        )}
                        style={{
                            '--w-custom': '2rem',
                            '--h-custom': '2rem',
                            bottom: '1rem',
                            right: '1rem',
                            zIndex: 2,
                        }}
                        onClick={handleRefreshScreenShareTrack}
                        disabled={isRefreshingScreenShare}
                        aria-label={c('Action').t`Refresh screen share track`}
                        title={c('Info').t`Refresh screen share track`}
                    >
                        <IcArrowsRotate size={4} className={clsx(isRefreshingScreenShare && 'animate-spin')} />
                    </button>
                )}
            </section>
            {isLargerThanMd && (
                <ParticipantSidebar
                    participantSideBarOpen={participantSideBarOpen}
                    setParticipantSideBarOpen={setParticipantSideBarOpen}
                />
            )}
        </>
    );
};
