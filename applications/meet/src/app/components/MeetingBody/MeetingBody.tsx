import { useState } from 'react';

import { RoomAudioRenderer, useParticipants } from '@livekit/components-react';
import type { LocalVideoTrack } from 'livekit-client';
import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import { SecurityShield } from '../../atoms/SecurityShield/SecurityShield';
import { useMeetContext } from '../../contexts/MeetContext';
import { useUIStateContext } from '../../contexts/UIStateContext';
import { useCurrentScreenShare } from '../../hooks/useCurrentScreenShare';
import { useMeetingInitialisation } from '../../hooks/useMeetingInitialisation';
import { Chat } from '../Chat/Chat';
import { MeetingDetails } from '../MeetingDetails/MeetingDetails';
import { MeetingReadyPopup } from '../MeetingReadyPopup/MeetingReadyPopup';
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

    const participants = useParticipants();

    const { videoTrack, participant, isLocal, stopScreenShare, screenShareVideoRef } = useCurrentScreenShare();

    const [participantSideBarOpen, setParticipantSideBarOpen] = useState(true);

    const { participantNameMap, meetingLink } = useMeetContext();

    const { sideBarState } = useUIStateContext();

    const isSideBarOpen = Object.values(sideBarState).some((value) => value);

    const getParticipantSideBarColumns = () => {
        if (!participantSideBarOpen) {
            return '0px';
        }

        return `${participants.length < 6 || isSideBarOpen ? 1 : 3}fr`;
    };

    const defaultColumns = `8fr${isSideBarOpen ? ' minmax(0, 3fr)' : ''}`;
    const screenShareColumns = `${isSideBarOpen ? 6 : 8}fr ${getParticipantSideBarColumns()}${isSideBarOpen ? ' minmax(0, 2fr)' : ''}`;

    return (
        <div className={clsx('w-full h-full flex flex-column flex-nowrap gap-4 overflow-hidden pl-4 pr-4 pb-0 pt-4')}>
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
                                title={c('l10n_nightly Info').t`End-to-end encryption is active for screen share`}
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
                {videoTrack ? (
                    <ParticipantSidebar
                        participantSideBarOpen={participantSideBarOpen}
                        setParticipantSideBarOpen={setParticipantSideBarOpen}
                    />
                ) : (
                    <ParticipantGrid />
                )}
                <Participants />
                <Settings />
                <Chat />
                <MeetingDetails />
            </div>
            <ParticipantControls />
            <RoomAudioRenderer />
            <ToastMessages />
            <NoPermissionInfo />
            <PermissionRequest />
            <MeetingReadyPopup meetingLink={meetingLink} />
        </div>
    );
};
