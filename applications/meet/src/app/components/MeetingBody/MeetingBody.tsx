import { useEffect, useRef } from 'react';

import { RoomAudioRenderer, useParticipants } from '@livekit/components-react';
import type { LocalVideoTrack } from 'livekit-client';

import clsx from '@proton/utils/clsx';

import { useMeetContext } from '../../contexts/MeetContext';
import { useChat } from '../../hooks/useChat';
import { useCurrentScreenShare } from '../../hooks/useCurrentScreenShare';
import { useE2EE } from '../../hooks/useE2EE';
import { useFaceTrackingPublisher } from '../../hooks/useFaceTrackingPublisher';
import { useLocalParticipantQualityControl } from '../../hooks/useLocalParticipantQualityControl';
import { usePaginationSizeUpdates } from '../../hooks/usePaginationSizeUpdates';
import { useParticipantEvents } from '../../hooks/useParticipantEvents';
import { usePublicationQualityControls } from '../../hooks/usePublicationQualityControls';
import { useResolutionInitialisation } from '../../hooks/useResolutionInitialisation';
import { useScreenShareUpdates } from '../../hooks/useScreenShareUpdates';
import { Chat } from '../Chat/Chat';
import { MeetingDetails } from '../MeetingDetails';
import { ParticipantControls } from '../ParticipantControls/ParticipantControls';
import { ParticipantGrid } from '../ParticipantGrid';
import { ParticipantSidebar } from '../ParticipantSidebar/ParticipantSidebar';
import { Participants } from '../Participants/Participants';
import { ScreenShareHeading } from '../ScreenShareHeading/ScreenShareHeading';
import { Settings } from '../Settings/Settings';
import { ToastMessages } from '../ToastMessages/ToastMessages';

import './MeetingBody.scss';

interface MeetingBodyProps {
    isFaceTrackingEnabled: boolean;
    faceTrack: LocalVideoTrack | null;
}

export const MeetingBody = ({ isFaceTrackingEnabled, faceTrack }: MeetingBodyProps) => {
    useE2EE();
    useFaceTrackingPublisher({ faceTrack, isFaceTrackingEnabled });
    usePublicationQualityControls();
    useResolutionInitialisation();
    useParticipantEvents();
    useChat();
    usePaginationSizeUpdates();
    useScreenShareUpdates();
    useLocalParticipantQualityControl();

    const participants = useParticipants();

    const { videoTrack, participant, isLocal, stopScreenShare } = useCurrentScreenShare();

    const { sideBarState } = useMeetContext();

    const screenShareVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoTrack && screenShareVideoRef.current) {
            videoTrack.attach(screenShareVideoRef.current);
            return () => {
                videoTrack.detach(screenShareVideoRef.current!);
            };
        }
    }, [videoTrack]);

    const isSideBarOpen = Object.values(sideBarState).some((value) => value);

    const defaultColumns = `8fr${isSideBarOpen ? ' 3fr' : ''}`;
    const screenShareColumns = `${isSideBarOpen ? 6 : 8}fr ${participants.length < 6 || isSideBarOpen ? 1 : 3}fr${isSideBarOpen ? ' 2fr' : ''}`;

    return (
        <div
            className={clsx(
                'w-full h-full flex flex-column flex-nowrap gap-4 overflow-hidden pl-4 pr-4 pb-0',
                videoTrack ? 'pt-4' : 'pt-8'
            )}
        >
            {videoTrack && (
                <ScreenShareHeading
                    name={participant?.name ?? ''}
                    isLocalUser={isLocal}
                    onStopScreenShare={stopScreenShare}
                />
            )}
            <div
                className="w-full flex-1 overflow-hidden"
                style={{
                    display: 'grid',
                    gridTemplateColumns: videoTrack ? screenShareColumns : defaultColumns,
                    gap: 16,
                }}
            >
                {videoTrack && (
                    <div
                        className="bg-strong w-full overflow-hidden mx-auto my-0 rounded"
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
                {videoTrack ? <ParticipantSidebar /> : <ParticipantGrid />}
                <Participants />
                <Settings />
                <Chat />
                <MeetingDetails />
            </div>
            <ParticipantControls />
            <RoomAudioRenderer />
            <ToastMessages />
        </div>
    );
};
