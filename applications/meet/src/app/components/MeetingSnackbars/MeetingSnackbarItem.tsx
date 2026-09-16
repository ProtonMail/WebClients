import { useMeetDispatch, useMeetSelector } from '@proton/meet/store/hooks';
import { selectChatMessage, setChatThreadExpanded } from '@proton/meet/store/slices/chatAndReactionsSlice';
import type { MeetingSnackbar } from '@proton/meet/store/slices/meetingSnackbarsSlice';
import { openChatAtMessage } from '@proton/meet/store/slices/uiStateSlice';
import { useFlag } from '@proton/unleash/useFlag';

import { MeetingUpdateSnackbar } from './MeetingUpdateSnackbar';
import { MentionSnackbar } from './MentionSnackbar';

interface Props {
    snackbar: MeetingSnackbar;
    onClose: () => void;
}

export const MeetingSnackbarItem = ({ snackbar, onClose }: Props) => {
    const dispatch = useMeetDispatch();

    const message = useMeetSelector((state) =>
        snackbar.type === 'event' ? undefined : selectChatMessage(state, snackbar.messageId)
    );

    const isChatThreadsEnabled = useFlag('MeetChatThreads');
    const isOpenMessageFromPreviewEnabled = useFlag('MeetOpenMessageFromPreview');

    if (snackbar.type === 'event') {
        return <MeetingUpdateSnackbar update={snackbar.event} onClose={onClose} />;
    }

    if (!message) {
        return null;
    }

    const handleOpen = () => {
        const { id, topicId } = message;

        if (isChatThreadsEnabled && topicId && topicId !== id) {
            dispatch(setChatThreadExpanded({ messageId: topicId, expanded: true }));
        }

        dispatch(openChatAtMessage(id));
    };

    const onOpen = isOpenMessageFromPreviewEnabled ? handleOpen : undefined;

    return snackbar.type === 'mention' ? (
        <MentionSnackbar message={message} onClose={onClose} onOpen={onOpen} />
    ) : (
        <MeetingUpdateSnackbar update={message} onClose={onClose} onOpen={onOpen} />
    );
};
