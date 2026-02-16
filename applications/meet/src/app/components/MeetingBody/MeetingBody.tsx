import { useEffect, useRef, useState } from 'react';

import type { TrackReference } from '@livekit/components-react';
import { RoomAudioRenderer, VideoTrack } from '@livekit/components-react';
import type { Participant } from 'livekit-client';
import { c } from 'ttag';

import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { TopBanner } from '@proton/components/index';
import { IcMeetRotateCamera } from '@proton/icons/icons/IcMeetRotateCamera';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectSideBarState } from '@proton/meet/store/slices/uiStateSlice';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import useFlag from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import { CircleButton } from '../../atoms/CircleButton/CircleButton';
import { SecurityShield } from '../../atoms/SecurityShield/SecurityShield';
import { useMediaManagementContext } from '../../contexts/MediaManagementProvider/MediaManagementContext';
import { useMeetContext } from '../../contexts/MeetContext';
import { useIsLargerThanMd } from '../../hooks/useIsLargerThanMd';
import { useIsNarrowHeight } from '../../hooks/useIsNarrowHeight';
import { useMeetingInitialisation } from '../../hooks/useMeetingInitialisation';
import { AssignHostSidebar } from '../AssignHostSidebar/AssignHostSidebar';
import { Chat } from '../Chat/Chat';
import { MeetingDetails, WrappedMeetingDetails } from '../MeetingDetails/MeetingDetails';
import { MeetingName } from '../MeetingName/MeetingName';
import { MeetingReadyPopup } from '../MeetingReadyPopup/MeetingReadyPopup';
import { NoDeviceDetectedInfo } from '../NoDeviceDetectedInfo/NoDeviceDetectedInfo';
import { NoDeviceDetectedModal } from '../NoDeviceDetectedModal/NoDeviceDetectedModal';
import { NoPermissionInfo } from '../NoPermissionInfo/NoPermissionInfo';
import { ParticipantControls } from '../ParticipantControls/ParticipantControls';
import { ParticipantGrid } from '../ParticipantGrid';
import { ParticipantSidebar } from '../ParticipantSidebar/ParticipantSidebar';
import { Participants } from '../Participants/Participants';
import { PermissionRequest } from '../PermissionRequest/PermissionRequest';
import { RecordingInProgressModal } from '../RecordingInProgressModal/RecordingInProgressModal';
import { Settings } from '../Settings/Settings';

import './MeetingBody.scss';

interface MeetingBodyProps {
    isScreenShare: boolean;
    isLocalScreenShare: boolean;
    screenShareTrack: TrackReference;
    screenShareParticipant: Participant;
    isUsingTurnRelay: boolean;
}

export const MeetingBody = ({
    isScreenShare,
    isLocalScreenShare,
    screenShareTrack,
    screenShareParticipant,
    isUsingTurnRelay,
}: MeetingBodyProps) => {
    useMeetingInitialisation();
    const isLargerThanMd = useIsLargerThanMd();

    const isNarrowHeight = useIsNarrowHeight();

    const { activeBreakpoint } = useActiveBreakpoint();
    const isXSmallScreen = activeBreakpoint === 'xsmall';

    const [participantSideBarOpen, setParticipantSideBarOpen] = useState(true);

    const { participantNameMap, meetingLink, guestMode } = useMeetContext();

    const { handleRotateCamera, isVideoEnabled } = useMediaManagementContext();

    const sideBarState = useMeetSelector(selectSideBarState);

    const [bannerIsClosed, setBannerIsClosed] = useState(!isUsingTurnRelay);

    const isEarlyAccess = useFlag('MeetEarlyAccess');

    const isSideBarOpen = Object.values(sideBarState).some((value) => value);

    const screenShareVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (isScreenShare && screenShareTrack?.publication?.track && screenShareVideoRef.current) {
            screenShareTrack.publication.track.attach(screenShareVideoRef.current);
        }

        return () => {
            if (screenShareTrack?.publication?.track && screenShareVideoRef.current) {
                screenShareTrack.publication.track.detach(screenShareVideoRef.current);
            }
        };
    }, [isScreenShare, screenShareTrack?.publication?.track?.sid]);

    const defaultScreenShareFlexGrow = isSideBarOpen ? 6 : 8;
    // Using 0 instead of removing the video element to avoid reinitializing the screenshare video
    const smallScreenScreenShareFlexGrow = isSideBarOpen ? 0 : 8;

    const presenterName = participantNameMap[screenShareParticipant?.identity ?? null] ?? '';

    const screenShareLabel = isLocalScreenShare
        ? c('Info').t`${presenterName} (you) is presenting`
        : c('Info').t`${presenterName} is presenting`;

    return (
        <div
            className={clsx(
                'w-full h-full flex flex-column flex-nowrap overflow-hidden pl-4 pr-4 pb-0 pt-4',
                isScreenShare ? 'gap-0' : 'gap-4',
                isElectronApp && 'pt-6'
            )}
        >
            {!bannerIsClosed && (
                <TopBanner className="bg-norm meet-radius turn-top-banner" onClose={() => setBannerIsClosed(true)}>{c(
                    'Banner'
                )
                    .t`Connected via TURN relay mode due to your network restrictions. This may increase latency and affect call quality.`}</TopBanner>
            )}
            {!isNarrowHeight && (
                <div className="flex lg:hidden flex-nowrap gap-2 justify-between items-center">
                    <MeetingName classNames={{ name: 'flex-1 text-lg text-semibold' }} />
                    <div className="text-ellipsis overflow-hidden">
                        {isVideoEnabled && isMobile() && (
                            <CircleButton
                                IconComponent={IcMeetRotateCamera}
                                onClick={() => {
                                    handleRotateCamera();
                                }}
                                ariaLabel={c('Alt').t`Rotate camera`}
                                size={5}
                                buttonStyle={{
                                    'padding-block': 0,
                                    'padding-inline': 0,
                                    width: '2.5rem',
                                    height: '2.5rem',
                                }}
                            />
                        )}
                    </div>
                </div>
            )}
            <div
                className={clsx(
                    'flex flex-nowrap w-full flex-1 overflow-hidden',
                    (participantSideBarOpen || isSideBarOpen) && isLargerThanMd ? 'gap-4' : 'gap-0'
                )}
            >
                {isScreenShare ? (
                    <>
                        <div
                            className="bg-strong h-full overflow-hidden mx-auto my-0 rounded relative shrink-1"
                            style={{
                                flexGrow: isLargerThanMd ? defaultScreenShareFlexGrow : smallScreenScreenShareFlexGrow,
                                flexBasis: 0,
                            }}
                        >
                            <VideoTrack
                                key={screenShareTrack?.publication?.track?.sid}
                                className="screen-share-video w-full h-full block object-contain"
                                trackRef={screenShareTrack}
                                autoPlay
                                playsInline
                                muted={isLocalScreenShare}
                                manageSubscription={false}
                            />
                            <div
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
                        </div>
                        {isLargerThanMd && (
                            <ParticipantSidebar
                                participantSideBarOpen={participantSideBarOpen}
                                setParticipantSideBarOpen={setParticipantSideBarOpen}
                            />
                        )}
                    </>
                ) : (
                    (isLargerThanMd || !isSideBarOpen) && (
                        <div className="h-full shrink-0" style={{ flexGrow: 8, flexBasis: 0 }}>
                            <ParticipantGrid />
                        </div>
                    )
                )}

                {isSideBarOpen && (
                    <div className="h-full shrink-0" style={{ flexGrow: isScreenShare ? 2 : 3, flexBasis: 0 }}>
                        <Participants />
                        <Settings />
                        <Chat />
                        <AssignHostSidebar />
                        {guestMode || !isEarlyAccess ? <MeetingDetails /> : <WrappedMeetingDetails />}
                    </div>
                )}
            </div>
            <ParticipantControls />
            <RoomAudioRenderer />
            <NoDeviceDetectedInfo />
            <NoDeviceDetectedModal />
            <NoPermissionInfo />
            <PermissionRequest />
            {isXSmallScreen && <MeetingReadyPopup meetingLink={meetingLink} closeBySlide={true} />}
            <RecordingInProgressModal />
        </div>
    );
};
