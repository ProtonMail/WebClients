import { useEffect, useRef, useState } from 'react';

import type { TrackReference } from '@livekit/components-react';
import { RoomAudioRenderer } from '@livekit/components-react';
import type { Participant } from '@proton-meet/livekit-client';
import { c } from 'ttag';

import { IcMeetRotateCamera } from '@proton/icons';
import { isMobile } from '@proton/shared/lib/helpers/browser';
import clsx from '@proton/utils/clsx';

import { CircleButton } from '../../atoms/CircleButton/CircleButton';
import { useMeetContext } from '../../contexts/MeetContext';
import { useUIStateContext } from '../../contexts/UIStateContext';
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

interface MeetingBodyProps {
    isScreenShare: boolean;
    isLocalScreenShare: boolean;
    stopScreenShare: () => void;
    screenShareTrack: TrackReference;
    screenShareParticipant: Participant;
}

export const MeetingBody = ({
    isScreenShare,
    isLocalScreenShare,
    stopScreenShare,
    screenShareTrack,
    screenShareParticipant,
}: MeetingBodyProps) => {
    useMeetingInitialisation();
    const isLargerThanMd = useIsLargerThanMd();

    const isNarrowHeight = useIsNarrowHeight();

    const [participantSideBarOpen, setParticipantSideBarOpen] = useState(true);

    const { participantNameMap, meetingLink, roomName, guestMode, handleRotateCamera, isVideoEnabled } =
        useMeetContext();

    const { sideBarState } = useUIStateContext();

    const isSideBarOpen = Object.values(sideBarState).some((value) => value);

    const getParticipantSideBarColumns = () => {
        return participantSideBarOpen ? 'max-content' : '0px';
    };

    const defaultColumns = isLargerThanMd ? `8fr${isSideBarOpen ? ' minmax(0, 3fr)' : ''}` : '1fr';
    const screenShareColumns = isLargerThanMd
        ? `${isSideBarOpen ? 6 : 8}fr ${getParticipantSideBarColumns()}${isSideBarOpen ? ' minmax(0, 2fr)' : ''}`
        : '1fr';

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
    }, [isScreenShare]);

    return (
        <div
            className={clsx(
                'w-full h-full flex flex-column flex-nowrap overflow-hidden pl-4 pr-4 pb-0 pt-4',
                isScreenShare ? 'gap-0' : 'gap-4'
            )}
        >
            {!isNarrowHeight && (
                <div className="flex lg:hidden flex-nowrap gap-2 justify-between items-center">
                    <div className="flex-1 h3 text-ellipsis overflow-hidden">{roomName}</div>
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
            {isScreenShare && (
                <ScreenShareHeading
                    name={participantNameMap[screenShareParticipant?.identity ?? ''] ?? ''}
                    isLocalUser={isLocalScreenShare}
                    onStopScreenShare={stopScreenShare}
                />
            )}
            <div
                className="w-full flex-1 overflow-hidden"
                style={{
                    display: 'grid',
                    gridTemplateColumns: isScreenShare ? screenShareColumns : defaultColumns,
                    gap: participantSideBarOpen || isSideBarOpen ? 16 : 0,
                }}
            >
                {isScreenShare && (
                    <div
                        className="bg-strong w-custom h-custom overflow-hidden mx-auto my-0 rounded relative"
                        style={{
                            background: '#000',
                            '--w-custom': isScreenShare ? '100%' : 0,
                            '--h-custom': isScreenShare ? '100%' : 0,
                        }}
                    >
                        <video
                            className="screen-share-video w-full h-full block object-contain"
                            ref={screenShareVideoRef}
                            autoPlay
                            playsInline
                            muted={isLocalScreenShare}
                        />
                    </div>
                )}
                {isScreenShare && isLargerThanMd ? (
                    <ParticipantSidebar
                        participantSideBarOpen={participantSideBarOpen}
                        setParticipantSideBarOpen={setParticipantSideBarOpen}
                    />
                ) : (
                    <>{(isLargerThanMd || !isSideBarOpen) && !isScreenShare && <ParticipantGrid />}</>
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
