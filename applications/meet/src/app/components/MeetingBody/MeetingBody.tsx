import { useEffect, useRef } from 'react';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import TopBanner from '@proton/components/containers/topBanners/TopBanner';
import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { IcMeetRotateCamera } from '@proton/icons/icons/IcMeetRotateCamera';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectMeetingLink } from '@proton/meet/store/slices/currentMeeting';
import { selectParticipantSideBarOpen } from '@proton/meet/store/slices/layoutSlice';
import { selectIsSideBarOpen } from '@proton/meet/store/slices/uiStateSlice';
import { selectIsGuest } from '@proton/meet/store/slices/userSlice';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { useFlag } from '@proton/unleash/useFlag';
import clsx from '@proton/utils/clsx';

import { CircleButton } from '../../atoms/CircleButton/CircleButton';
import { useMediaManagementContext } from '../../contexts/MediaManagementProvider/MediaManagementContext';
import type { ReconnectingCause } from '../../hooks/useConnectionStatus/getReconnectingCause';
import type { ConnectionStatus } from '../../hooks/useConnectionStatus/useConnectionStatus';
import { useIsLargerThanMd } from '../../hooks/useIsLargerThanMd';
import { useIsNarrowHeight } from '../../hooks/useIsNarrowHeight';
import { useMeetingInitialisation } from '../../hooks/useMeetingInitialisation';
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
import { ReactionStream } from '../ReactionStream/ReactionStream';
import { RecordingInProgressModal } from '../RecordingInProgressModal/RecordingInProgressModal';
import { Settings } from '../Settings/Settings';
import { AudioRenderer } from './AudioRenderer';

import './MeetingBody.scss';

const RECONNECTING_BANNER_TEST_IDS: Record<ReconnectingCause, string> = {
    fullRejoin: 'connection-banner-full-rejoin',
    encryptionRetry: 'connection-banner-encryption-retry',
    liveKitReconnect: 'connection-banner-livekit-reconnect',
    meetingServer: 'connection-banner-meeting-server',
};

interface MeetingBodyProps {
    connectionStatus: ConnectionStatus;
}

export const MeetingBody = ({ connectionStatus }: MeetingBodyProps) => {
    useMeetingInitialisation();

    const isGuest = useMeetSelector(selectIsGuest);

    const isLargerThanMd = useIsLargerThanMd();

    const isNarrowHeight = useIsNarrowHeight();

    const { activeBreakpoint, viewportWidth } = useActiveBreakpoint();
    const isXSmallScreen = activeBreakpoint === 'xsmall';
    const isLargeDesktop = viewportWidth['>=xlarge'];

    const participantSideBarOpen = useMeetSelector(selectParticipantSideBarOpen);

    const meetingLink = useMeetSelector(selectMeetingLink);

    const { handleRotateCamera, isVideoEnabled } = useMediaManagementContext();

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

    return (
        <main ref={mainContainerRef} tabIndex={-1} className="w-full h-full flex flex-column flex-nowrap outline-none">
            {/* Visual-only: announced centrally by useConnectionAnnouncements. */}
            {connectionStatus.phase === 'reconnecting' && (
                <TopBanner
                    className="bg-warning"
                    innerClassName="flex flex-nowrap items-center justify-center gap-2 text-semibold color-invert"
                    announce={false}
                    data-testid={RECONNECTING_BANNER_TEST_IDS[connectionStatus.cause]}
                >
                    <CircleLoader
                        srLabelHidden
                        aria-hidden="true"
                        className="shrink-0 w-custom h-custom"
                        style={{ '--w-custom': '1rem', '--h-custom': '1rem' }}
                    />
                    <span>{c('Info').t`Connection lost. Reconnecting…`}</span>
                </TopBanner>
            )}
            {connectionStatus.phase === 'reconnected' && (
                <TopBanner
                    className="bg-success"
                    innerClassName="text-semibold color-invert"
                    announce={false}
                    data-testid="connection-banner-reconnected"
                >
                    {c('Info').t`Reconnected`}
                </TopBanner>
            )}
            <MeetingTopBanner />
            <div
                className={clsx(
                    'w-full h-full flex flex-column flex-nowrap overflow-hidden gap-4 pl-4 pr-4 pb-0 pt-4',
                    isElectronApp && 'pt-6'
                )}
            >
                {!isNarrowHeight && !isLargeDesktop && (
                    <div className="flex flex-nowrap gap-2 justify-between items-center">
                        <MeetingName classNames={{ name: 'flex-1 text-lg text-semibold' }} />
                        <div className="shrink-0">
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
                    <ParticipantsLayout />

                    {isSideBarOpen && (
                        <div
                            className="h-full shrink-0 min-w-custom"
                            style={{ flexGrow: 3, flexBasis: 0, '--min-w-custom': 'min(20rem, 100%)' }}
                        >
                            <ParticipantList />
                            <Settings />
                            <Chat />
                            <AssignHostSidebar />
                            <Backgrounds />
                            {isGuest ? <MeetingDetails /> : <WrappedMeetingDetails />}
                        </div>
                    )}
                </div>
                <Captions />
                <ParticipantControls />
                <ReactionStream />
                <AudioRenderer isSpatialAudioEnabled={isSpatialAudioEnabled} />
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
