import { c } from 'ttag';

import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectParticipantName } from '@proton/meet/store/slices/participants/participantsSlice';
import type { MeetChatMessage } from '@proton/meet/types/types';

import { CloseButton } from '../../atoms/CloseButton/CloseButton';
import { useParticipantDisplayColors } from '../../hooks/useParticipantDisplayColors';
import { MessageSegments } from '../MessageSegments/MessageSegments';
import { MeetingSnackbarCard } from './MeetingSnackbarCard';
import { MeetingSnackbarContent } from './MeetingSnackbarContent';

interface Props {
    message: MeetChatMessage;
    onClose: () => void;
    onOpen?: () => void;
}

export const MentionSnackbar = ({ message, onClose, onOpen }: Props) => {
    const senderName = useMeetSelector((state) => selectParticipantName(state, message.identity));

    const {
        participantColors: { profileTextColor },
    } = useParticipantDisplayColors(message.identity);

    const senderNameNode = (
        <bdi key="sender-name" className={profileTextColor}>
            {senderName}
        </bdi>
    );

    return (
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
        <MeetingSnackbarCard
            role="group"
            aria-label={c('Info').t`Mention from ${senderName}`}
            onOpen={onOpen}
            openLabel={c('Action').t`Open mention from ${senderName} in chat`}
        >
            <MeetingSnackbarContent
                identity={message.identity}
                participantName={senderName}
                title={
                    // translator: full sentence is "<participant name> mentioned you"
                    c('Info').jt`${senderNameNode} mentioned you`
                }
                body={<MessageSegments message={message.message} />}
            />

            <CloseButton onClose={onClose} className="ml-auto" />
        </MeetingSnackbarCard>
    );
};
