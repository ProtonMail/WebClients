import { c } from 'ttag';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectRoomName } from '@proton/meet/store/slices/meetingInfo';
import {
    selectLocalParticipantIdentity,
    selectParticipantName,
} from '@proton/meet/store/slices/participants/participantsSlice';
import {
    type MeetChatMessage,
    type MeetingRoomUpdate,
    ParticipantEvent,
    type ParticipantEventRecord,
} from '@proton/meet/types/types';
import { splitMessageIntoMentionSegments } from '@proton/meet/utils/mentions/mentionToken';

import { CloseButton } from '../../atoms/CloseButton/CloseButton';
import { addSpecialCharactersForMessageDisplay } from '../../utils/addSpecialCharactersForMessageDisplay';
import { getAgentDisplayInfo } from '../../utils/getAgentDisplayInfo';
import { Mention } from '../Mention/Mention';
import { MeetingSnackbarCard } from './MeetingSnackbarCard';
import { MeetingSnackbarContent } from './MeetingSnackbarContent';

interface Props {
    update: MeetingRoomUpdate;
    onClose: () => void;
    onOpen?: () => void;
}

const isChatMessage = (update: MeetingRoomUpdate): update is MeetChatMessage => update.type === 'message';

const isParticipantEventRecord = (update: MeetingRoomUpdate): update is ParticipantEventRecord =>
    update.type === 'event';

export const MeetingUpdateSnackbar = ({ update, onClose, onOpen }: Props) => {
    const roomName = useMeetSelector(selectRoomName);
    const participantName = useMeetSelector((state) => selectParticipantName(state, update.identity));
    const localParticipantIdentity = useMeetSelector(selectLocalParticipantIdentity);

    // Agents aren't in the decrypted name map, so resolve their name from the metadata on the event.
    const agentInfo = isParticipantEventRecord(update) && update.isAgent ? getAgentDisplayInfo(update.identity) : null;
    const displayName = agentInfo ? agentInfo.displayName : participantName;

    const roomNameLabel = (
        <span key="room-name" style={{ color: 'var(--interaction-norm)' }}>
            {roomName}
        </span>
    );

    const getBody = () => {
        if (isChatMessage(update)) {
            return splitMessageIntoMentionSegments(addSpecialCharactersForMessageDisplay(update.message)).map(
                (segment, index) =>
                    segment.type === 'mention' ? (
                        <Mention key={`mention-${index}`} id={segment.id} />
                    ) : (
                        <span key={`text-${index}`}>{segment.text}</span>
                    )
            );
        }

        if (isParticipantEventRecord(update) && update.eventType === ParticipantEvent.Join) {
            // translator: full sentence is "Joined <room name>" (please keep the style, do NOT translate by saying "You joined...", as it might be misleading)
            return c('Info').jt`Joined ${roomNameLabel}`;
        }

        // translator: full sentence is "Left <room name>" (please keep the style, do NOT translate by saying "You left...", as it might be misleading)
        return c('Info').jt`Left ${roomNameLabel}`;
    };

    return (
        <MeetingSnackbarCard aria-hidden="true" onOpen={onOpen} isOpenTargetFocusable={false}>
            <MeetingSnackbarContent
                identity={update.identity}
                participantName={displayName}
                isAgent={Boolean(agentInfo)}
                title={
                    <>
                        <bdi>{displayName}</bdi>
                        {update.identity === localParticipantIdentity && (
                            <span className="color-weak ml-1">{c('Info').t`(You)`}</span>
                        )}
                    </>
                }
                body={getBody()}
            />

            <CloseButton onClose={onClose} className="ml-auto" tabIndex={-1} />
        </MeetingSnackbarCard>
    );
};
