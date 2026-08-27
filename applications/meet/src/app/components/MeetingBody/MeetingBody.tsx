import { useEffect, useRef, useState } from 'react';

import { RoomAudioRenderer } from '@livekit/components-react';
import { ConnectionState } from 'livekit-client';
import { c } from 'ttag';

import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { TopBanner } from '@proton/components/index';
import { IcMeetRotateCamera } from '@proton/icons/icons/IcMeetRotateCamera';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectMeetingLink } from '@proton/meet/store/slices/meetingInfo';
import { selectIsScreenShare } from '@proton/meet/store/slices/screenShareStatusSlice';
import { selectIsSideBarOpen } from '@proton/meet/store/slices/uiStateSlice';
import { selectIsGuest } from '@proton/meet/store/slices/userSlice';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { useFlag } from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import { CircleButton } from '../../atoms/CircleButton/CircleButton';
import { useMediaManagementContext } from '../../contexts/MediaManagementProvider/MediaManagementContext';
import { useIsLargerThanMd } from '../../hooks/useIsLargerThanMd';
import { useIsNarrowHeight } from '../../hooks/useIsNarrowHeight';
import { useMeetingInitialisation } from '../../hooks/useMeetingInitialisation';
import { SpatialAudioRoomAudioRenderer } from '../../utils/spatialAudio/SpatialAudioRoomAudioRenderer';
import { AssignHostSidebar } from '../AssignHostSidebar/AssignHostSidebar';
import { Backgrounds } from '../Backgrounds/Backgrounds';
import { Captions } from '../Captions/Captions';
import { Chat } from '../Chat/Chat';
import { MeetingDetails, WrappedMeetingDetails } from '../MeetingDetails/MeetingDetails';
import { MeetingName } from '../MeetingName/MeetingName';
import { MeetingReadyPopup } from '../MeetingReadyPopup/MeetingReadyPopup';
import { MeetingTopBanner } from '../MeetingTopBanner/MeetingTopBanner';
import { NoDeviceDetectedInfo } from '../NoDeviceDetectedInfo/NoDeviceDetectedInfo';
import { NoDeviceDetectedModal } from '../NoDeviceDetectedModal/NoDeviceDetectedModal';
import { NoPermissionInfo } from '../NoPermissionInfo/NoPermissionInfo';
import { ParticipantControls } from '../ParticipantControls/ParticipantControls';
import { ParticipantList } from '../ParticipantList/ParticipantList';
import { ParticipantsLayout } from '../ParticipantsLayout/ParticipantsLayout';
import { PermissionRequest } from '../PermissionRequest/PermissionRequest';
import { RecordingInProgressModal } from '../RecordingInProgressModal/RecordingInProgressModal';
import { Settings } from '../Settings/Settings';

import './MeetingBody.scss';

interface MeetingBodyProps {
    isUsingTurnRelay: boolean;
    liveKitConnectionState: ConnectionState | null;
    showReconnectedMessage: boolean;
    setShowReconnectedMessage: React.Dispatch<React.SetStateAction<boolean>>;
    setLiveKitConnectionState: React.Dispatch<React.SetStateAction<ConnectionState | null>>;
    isDisconnected: boolean;
    isReconnecting: boolean;
    mlsRetrying: boolean;
}

export const MeetingBody = ({
    isUsingTurnRelay,
    liveKitConnectionState,
    showReconnectedMessage,
    setShowReconnectedMessage,
    setLiveKitConnectionState,
    isDisconnected,
    isReconnecting,
    mlsRetrying,
}: MeetingBodyProps) => {
    useMeetingInitialisation();

    const isGuest = useMeetSelector(selectIsGuest);

    const isLargerThanMd = useIsLargerThanMd();

    const isNarrowHeight = useIsNarrowHeight();

    const { activeBreakpoint } = useActiveBreakpoint();
    const isXSmallScreen = activeBreakpoint === 'xsmall';

    const [participantSideBarOpen, setParticipantSideBarOpen] = useState(true);

    const meetingLink = useMeetSelector(selectMeetingLink);

    const { handleRotateCamera, isVideoEnabled } = useMediaManagementContext();

    const isScreenShare = useMeetSelector(selectIsScreenShare);

    const [bannerIsClosed, setBannerIsClosed] = useState(!isUsingTurnRelay);

    const isEarlyAccess = useFlag('MeetEarlyAccess');

    const isSideBarOpen = useMeetSelector(selectIsSideBarOpen);

    // Firefox/macOS leaves focus on browser chrome after joining; move it into the page so the
    // live region is observed immediately without the user having to click first.
    const mainContainerRef = useRef<HTMLElement>(null);
    useEffect(() => {
        mainContainerRef.current?.focus();
    }, []);

    const isMeetEnableAudioMixing = useFlag('MeetEnableAudioMixing');
    const isMeetEnableSpatialAudio = useFlag('MeetEnableSpatialAudio');
    const isSpatialAudioEnabled = isMeetEnableAudioMixing && isMeetEnableSpatialAudio;

    const getConnectionStatusMessage = (
        showReconnectedMessage: boolean,
        liveKitConnectionState: ConnectionState | null
    ) => {
        if (showReconnectedMessage) {
            return c('Info').t`Reconnected successfully`;
        }
        if (liveKitConnectionState === ConnectionState.SignalReconnecting) {
            return c('Info').t`Connection interrupted. Reconnecting...`;
        }
        return c('Info').t`Reconnecting to meeting...`;
    };

    return (
        <main ref={mainContainerRef} tabIndex={-1} className="w-full h-full flex flex-column flex-nowrap outline-none">
            <MeetingTopBanner />
            <div
                className={clsx(
                    'w-full h-full flex flex-column flex-nowrap overflow-hidden pl-4 pr-4 pb-0 pt-4',
                    isScreenShare ? 'gap-0' : 'gap-4',
                    isElectronApp && 'pt-6'
                )}
            >
                {!bannerIsClosed && (
                    <TopBanner
                        className="bg-norm meet-radius turn-top-banner"
                        onClose={() => setBannerIsClosed(true)}
                        // Announced centrally by useTurnRelayAnnouncements to avoid a double read.
                        announce={false}
                    >{c('Banner')
                        .t`Connected via TURN relay mode due to your network restrictions. This may increase latency and affect call quality.`}</TopBanner>
                )}
                {/* Visual-only: announced centrally by useConnectionAnnouncements. */}
                {isReconnecting && (
                    <TopBanner className="bg-warning meet-radius" announce={false}>
                        {c('Info').t`Connection lost. Reconnecting…`}
                    </TopBanner>
                )}
                {!isReconnecting && mlsRetrying && (
                    <TopBanner className="bg-warning meet-radius" announce={false}>
                        {c('Info').t`Connection issue detected. Attempting to recover…`}
                    </TopBanner>
                )}
                {!isReconnecting &&
                    !mlsRetrying &&
                    !isDisconnected &&
                    (liveKitConnectionState === ConnectionState.SignalReconnecting ||
                        liveKitConnectionState === ConnectionState.Reconnecting ||
                        showReconnectedMessage) && (
                        <TopBanner
                            className={showReconnectedMessage ? 'bg-success meet-radius' : 'bg-warning meet-radius'}
                            announce={false}
                            onClose={() => {
                                setShowReconnectedMessage(false);
                                setLiveKitConnectionState(null);
                            }}
                        >
                            {getConnectionStatusMessage(showReconnectedMessage, liveKitConnectionState)}
                        </TopBanner>
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
                    <ParticipantsLayout
                        participantSideBarOpen={participantSideBarOpen}
                        setParticipantSideBarOpen={setParticipantSideBarOpen}
                    />

                    {isSideBarOpen && (
                        <div
                            className="h-full shrink-0 min-w-custom"
                            style={{ flexGrow: isScreenShare ? 2 : 3, flexBasis: 0, '--min-w-custom': '20rem' }}
                        >
                            <ParticipantList />
                            <Settings />
                            <Chat />
                            <AssignHostSidebar />
                            <Backgrounds />
                            {isGuest || !isEarlyAccess ? <MeetingDetails /> : <WrappedMeetingDetails />}
                        </div>
                    )}
                </div>
                <Captions />
                <ParticipantControls />
                {isSpatialAudioEnabled ? <SpatialAudioRoomAudioRenderer /> : <RoomAudioRenderer />}
                <NoDeviceDetectedInfo />
                <NoDeviceDetectedModal />
                <NoPermissionInfo />
                <PermissionRequest />
                {isXSmallScreen && <MeetingReadyPopup meetingLink={meetingLink} closeBySlide={true} />}
                <RecordingInProgressModal />
            </div>
        </main>
    );
};
