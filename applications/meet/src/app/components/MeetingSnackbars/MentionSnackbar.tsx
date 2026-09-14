import { c } from 'ttag';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectParticipantName } from '@proton/meet/store/slices/participants/participantsSlice';
import type { MeetChatMessage } from '@proton/meet/types/types';
import { splitMessageIntoMentionSegments } from '@proton/meet/utils/mentions/mentionToken';

import { CloseButton } from '../../atoms/CloseButton/CloseButton';
import { useParticipantDisplayColors } from '../../hooks/useParticipantDisplayColors';
import { addSpecialCharactersForMessageDisplay } from '../../utils/addSpecialCharactersForMessageDisplay';
import { Mention } from '../Mention/Mention';
import { MeetingSnackbarCard } from './MeetingSnackbarCard';
import { MeetingSnackbarContent } from './MeetingSnackbarContent';

interface Props {
    message: MeetChatMessage;
    onClose: () => void;
}

export const MentionSnackbar = ({ message, onClose }: Props) => {
    const senderName = useMeetSelector((state) => selectParticipantName(state, message.identity));

    const {
        participantColors: { profileTextColor },
    } = useParticipantDisplayColors(message.identity);

    const segments = splitMessageIntoMentionSegments(addSpecialCharactersForMessageDisplay(message.message));

    const senderNameNode = (
        <bdi key="sender-name" className={profileTextColor}>
            {senderName}
        </bdi>
    );

    return (
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
        <MeetingSnackbarCard role="group" aria-label={c('Info').t`Mention from ${senderName}`}>
            <MeetingSnackbarContent
                identity={message.identity}
                participantName={senderName}
                title={
                    // translator: full sentence is "<participant name> mentioned you"
                    c('Info').jt`${senderNameNode} mentioned you`
                }
                body={segments.map((segment, index) =>
                    segment.type === 'mention' ? (
                        <Mention key={`mention-${index}`} id={segment.id} />
                    ) : (
                        <span key={`text-${index}`}>{segment.text}</span>
                    )
                )}
            />

            <CloseButton onClose={onClose} className="ml-auto" />
        </MeetingSnackbarCard>
    );
};
