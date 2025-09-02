import { useState } from 'react';

import { RoomAudioRenderer } from '@livekit/components-react';

import clsx from '@proton/utils/clsx';

import { useMeetContext } from '../../contexts/MeetContext';
import { useUIStateContext } from '../../contexts/UIStateContext';
import { useCurrentScreenShare } from '../../hooks/useCurrentScreenShare';
import { useIsLargerThanMd } from '../../hooks/useIsLargerThanMd';
import { useIsNarrowHeight } from '../../hooks/useIsNarrowHeight';
import { useMeetingInitialisation } from '../../hooks/useMeetingInitialisation';
import { Chat } from '../Chat/Chat';
import { MeetingDetails, WrappedMeetingDetails } from '../MeetingDetails/MeetingDetails';
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

import './MeetingBody.scss';

export const MeetingBody = () => {
    useMeetingInitialisation();

    const { videoTrack, participant, isLocal, stopScreenShare, screenShareVideoRef } = useCurrentScreenShare();

    const isLargerThanMd = useIsLargerThanMd();

    const isNarrowHeight = useIsNarrowHeight();

    const [participantSideBarOpen, setParticipantSideBarOpen] = useState(true);

    const { participantNameMap, meetingLink, roomName, guestMode } = useMeetContext();

    const { sideBarState } = useUIStateContext();

    const isSideBarOpen = Object.values(sideBarState).some((value) => value);

    const getParticipantSideBarColumns = () => {
        return participantSideBarOpen ? 'max-content' : '0px';
    };

    const defaultColumns = isLargerThanMd ? `8fr${isSideBarOpen ? ' minmax(0, 3fr)' : ''}` : '1fr';
    const screenShareColumns = isLargerThanMd
        ? `${isSideBarOpen ? 6 : 8}fr ${getParticipantSideBarColumns()}${isSideBarOpen ? ' minmax(0, 2fr)' : ''}`
        : '1fr';

    return (
        <div
            className={clsx(
                'w-full h-full flex flex-column flex-nowrap overflow-hidden pl-4 pr-4 pb-0 pt-4',
                !!videoTrack ? 'gap-0' : 'gap-4'
            )}
        >
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
                        {guestMode ? <MeetingDetails /> : <WrappedMeetingDetails />}
                    </>
                )}
            </div>
            <ParticipantControls />
            <RoomAudioRenderer />
            <NoDeviceDetectedInfo />
            <NoDeviceDetectedModal />
            <NoPermissionInfo />
            <PermissionRequest />
            <MeetingReadyPopup meetingLink={meetingLink} />
        </div>
    );
};
