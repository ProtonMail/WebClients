import { useState } from 'react';

import { RoomAudioRenderer } from '@livekit/components-react';
import type { LocalVideoTrack } from '@proton-meet/livekit-client';
import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import { SecurityShield } from '../../atoms/SecurityShield/SecurityShield';
import { useMeetContext } from '../../contexts/MeetContext';
import { useUIStateContext } from '../../contexts/UIStateContext';
import { useCurrentScreenShare } from '../../hooks/useCurrentScreenShare';
import { useIsLargerThanMd } from '../../hooks/useIsLargerThanMd';
import { useIsNarrowHeight } from '../../hooks/useIsNarrowHeight';
import { useMeetingInitialisation } from '../../hooks/useMeetingInitialisation';
import { Chat } from '../Chat/Chat';
import { MeetingDetails } from '../MeetingDetails/MeetingDetails';
import { MeetingReadyPopup } from '../MeetingReadyPopup/MeetingReadyPopup';
import { NoDeviceDetectedInfo } from '../NoDeviceDetectedInfo/NoDeviceDetectedInfo';
import { NoDeviceDetectedModal } from '../NoDeviceDetectedModal/NoDeviceDetectedModal';
import { NoPermissionInfo } from '../NoPermissionInfo/NoPermissionInfo';
import { ParticipantControls } from '../ParticipantControls/ParticipantControls';
import { ParticipantGrid } from '../ParticipantGrid';
import { ParticipantSidebar } from '../ParticipantSidebar/ParticipantSidebar';
import { Participants } from '../Participants/Participants';
import { PermissionRequest } from '../PermissionRequest/PermissionRequest';
import { ScreenShareHeading } from '../ScreenShareHeading/ScreenShareHeading';
import { Settings } from '../Settings/Settings';
import { ToastMessages } from '../ToastMessages/ToastMessages';

import './MeetingBody.scss';

interface MeetingBodyProps {
    isFaceTrackingEnabled: boolean;
    faceTrack: LocalVideoTrack | null;
}

export const MeetingBody = ({ isFaceTrackingEnabled, faceTrack }: MeetingBodyProps) => {
    useMeetingInitialisation({ faceTrack, isFaceTrackingEnabled });

    const { videoTrack, participant, isLocal, stopScreenShare, screenShareVideoRef } = useCurrentScreenShare();

    const isLargerThanMd = useIsLargerThanMd();

    const isNarrowHeight = useIsNarrowHeight();

    const [participantSideBarOpen, setParticipantSideBarOpen] = useState(true);

    const { participantNameMap, meetingLink, roomName } = useMeetContext();

    const { sideBarState } = useUIStateContext();

    const isSideBarOpen = Object.values(sideBarState).some((value) => value);

    const getParticipantSideBarColumns = () => {
        return participantSideBarOpen ? '1fr' : '0px';
    };

    const defaultColumns = isLargerThanMd ? `8fr${isSideBarOpen ? ' minmax(0, 3fr)' : ''}` : '1fr';
    const screenShareColumns = isLargerThanMd
        ? `${isSideBarOpen ? 6 : 8}fr ${getParticipantSideBarColumns()}${isSideBarOpen ? ' minmax(0, 2fr)' : ''}`
        : '1fr';

    return (
        <div className={clsx('w-full h-full flex flex-column flex-nowrap gap-4 overflow-hidden pl-4 pr-4 pb-0 pt-4')}>
            {!isNarrowHeight && (
                <div className="flex lg:hidden flex-nowrap gap-2">
                    <div className="flex-1 justify-start h3 text-ellipsis overflow-hidden">{roomName}</div>
                </div>
            )}
            {videoTrack && (
                <ScreenShareHeading
                    name={participantNameMap[participant?.identity ?? ''] ?? ''}
                    isLocalUser={isLocal}
                    onStopScreenShare={stopScreenShare}
                />
            )}
            <div
                className="w-full flex-1 overflow-hidden"
                style={{
                    display: 'grid',
                    gridTemplateColumns: videoTrack ? screenShareColumns : defaultColumns,
                    gap: participantSideBarOpen || isSideBarOpen ? 16 : 0,
                }}
            >
                {videoTrack && (
                    <div
                        className="bg-strong w-full overflow-hidden mx-auto my-0 rounded relative"
                        style={{
                            background: '#000',
                        }}
                    >
                        <div
                            className="absolute bottom-custom left-custom z-up"
                            style={{ '--bottom-custom': '1rem', '--left-custom': '1rem' }}
                        >
                            <SecurityShield
                                title={c('meet_2025 Info').t`End-to-end encryption is active for screen share`}
                            />
                        </div>
                        <video
                            className="screen-share-video w-full h-full block object-contain"
                            ref={screenShareVideoRef}
                            autoPlay
                            playsInline
                            muted={isLocal}
                        />
                    </div>
                )}
                {videoTrack && isLargerThanMd ? (
                    <ParticipantSidebar
                        participantSideBarOpen={participantSideBarOpen}
                        setParticipantSideBarOpen={setParticipantSideBarOpen}
                    />
                ) : (
                    <>{(isLargerThanMd || !isSideBarOpen) && !videoTrack && <ParticipantGrid />}</>
                )}
                {(isLargerThanMd || isSideBarOpen) && (
                    <>
                        <Participants />
                        <Settings />
                        <Chat />
                        <MeetingDetails />
                    </>
                )}
            </div>
            <ParticipantControls />
            <RoomAudioRenderer />
            <ToastMessages />
            <NoDeviceDetectedInfo />
            <NoDeviceDetectedModal />
            <NoPermissionInfo />
            <PermissionRequest />
            <MeetingReadyPopup meetingLink={meetingLink} />
        </div>
    );
};
