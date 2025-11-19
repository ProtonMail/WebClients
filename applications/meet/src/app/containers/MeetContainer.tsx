import { useEffect, useState } from 'react';

import { VideoQuality } from 'livekit-client';

import { isSafari } from '@proton/shared/lib/helpers/browser';

import { AutoCloseMeetingModal } from '../components/AutoCloseMeetingModal/AutoCloseMeetingModal';
import { MeetingBody } from '../components/MeetingBody/MeetingBody';
import { PAGE_SIZE, SMALL_SCREEN_PAGE_SIZE } from '../constants';
import { MeetContext } from '../contexts/MeetContext';
import { UIStateProvider } from '../contexts/UIStateContext';
import { useCurrentScreenShare } from '../hooks/useCurrentScreenShare';
import { useIsLargerThanMd } from '../hooks/useIsLargerThanMd';
import { useIsNarrowHeight } from '../hooks/useIsNarrowHeight';
import { useParticipantEvents } from '../hooks/useParticipantEvents';
import { useSortedParticipants } from '../hooks/useSortedParticipants';
import type { MLSGroupState, MeetChatMessage, ParticipantEntity } from '../types';

interface MeetContainerProps {
    locked: boolean;
    maxDuration: number;
    maxParticipants: number;
    mlsGroupState: MLSGroupState | null;
    displayName: string;
    handleLeave: () => void;
    handleEndMeeting: () => Promise<void>;
    shareLink: string;
    roomName: string;
    participantsMap: Record<string, ParticipantEntity>;
    participantNameMap: Record<string, string>;
    getParticipants: () => Promise<void>;
    instantMeeting: boolean;
    passphrase: string;
    guestMode: boolean;
    handleMeetingLockToggle: (enable: boolean) => Promise<void>;
    isMeetingLocked: boolean;
    isDisconnected: boolean;
    startPiP: () => void;
    stopPiP: () => void;
    chatMessages: MeetChatMessage[];
    setChatMessages: React.Dispatch<React.SetStateAction<MeetChatMessage[]>>;
    pipSetup: (throttle: boolean) => void;
    pipCleanup: () => void;
    preparePictureInPicture: () => void;
}

export const MeetContainer = ({
    locked,
    maxDuration,
    maxParticipants,
    mlsGroupState,
    displayName,
    handleLeave,
    handleEndMeeting,
    shareLink,
    roomName,
    participantsMap,
    participantNameMap,
    getParticipants,
    instantMeeting,
    passphrase,
    guestMode,
    handleMeetingLockToggle,
    isMeetingLocked,
    isDisconnected,
    startPiP,
    stopPiP,
    chatMessages,
    setChatMessages,
    pipSetup,
    pipCleanup,
    preparePictureInPicture,
}: MeetContainerProps) => {
    const [quality, setQuality] = useState<VideoQuality>(VideoQuality.HIGH);
    const [page, setPage] = useState(0);

    const isLargerThanMd = useIsLargerThanMd();
    const isNarrowHeight = useIsNarrowHeight();

    const [pageSize, setPageSize] = useState(isLargerThanMd && !isNarrowHeight ? PAGE_SIZE : SMALL_SCREEN_PAGE_SIZE);
    const [resolution, setResolution] = useState<string | null>(null);

    const participantEvents = useParticipantEvents(participantNameMap);

    const [disableVideos, setDisableVideos] = useState(false);

    const [participantsWithDisabledVideos, setParticipantsWithDisabledVideos] = useState<string[]>([]);

    const { sortedParticipants, pagedParticipants, pageCount } = useSortedParticipants({
        page,
        pageSize,
    });

    const {
        isScreenShare,
        isLocalScreenShare,
        startScreenShare,
        stopScreenShare,
        screenShareParticipant,
        screenShareTrack,
    } = useCurrentScreenShare({ stopPiP, startPiP, preparePictureInPicture });

    useEffect(() => {
        if (isSafari()) {
            void pipSetup(true);

            return pipCleanup;
        }
    }, []);

    return (
        <div className="w-full h-full flex flex-col flex-nowrap items-center justify-center">
            <MeetContext.Provider
                value={{
                    page,
                    quality,
                    setPage,
                    setQuality,
                    roomName,
                    resolution,
                    setResolution,
                    meetingLink: shareLink,
                    chatMessages,
                    setChatMessages,
                    participantEvents,
                    pageSize,
                    setPageSize,
                    handleLeave,
                    handleEndMeeting,
                    participantsMap,
                    participantNameMap,
                    getParticipants,
                    disableVideos,
                    setDisableVideos,
                    participantsWithDisabledVideos,
                    setParticipantsWithDisabledVideos,
                    displayName,
                    sortedParticipants,
                    pagedParticipants,
                    pageCount,
                    passphrase,
                    guestMode,
                    mlsGroupState,
                    startScreenShare,
                    stopScreenShare,
                    isLocalScreenShare,
                    isScreenShare,
                    screenShareParticipant,
                    screenShareTrack,
                    handleMeetingLockToggle,
                    isMeetingLocked,
                    isDisconnected,
                    startPiP,
                    stopPiP,
                    preparePictureInPicture,
                    locked,
                    maxDuration,
                    maxParticipants,
                    instantMeeting,
                }}
            >
                <UIStateProvider instantMeeting={instantMeeting}>
                    <MeetingBody
                        isScreenShare={isScreenShare}
                        isLocalScreenShare={isLocalScreenShare}
                        stopScreenShare={stopScreenShare}
                        screenShareTrack={screenShareTrack}
                        screenShareParticipant={screenShareParticipant}
                    />
                </UIStateProvider>
            </MeetContext.Provider>
            <AutoCloseMeetingModal onLeave={() => handleLeave()} />
        </div>
    );
};
