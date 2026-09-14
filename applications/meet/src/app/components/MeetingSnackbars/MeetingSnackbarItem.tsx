import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectChatMessage } from '@proton/meet/store/slices/chatAndReactionsSlice';
import type { MeetingSnackbar } from '@proton/meet/store/slices/meetingSnackbarsSlice';

import { MeetingUpdateSnackbar } from './MeetingUpdateSnackbar';
import { MentionSnackbar } from './MentionSnackbar';

interface Props {
    snackbar: MeetingSnackbar;
    onClose: () => void;
}

export const MeetingSnackbarItem = ({ snackbar, onClose }: Props) => {
    const message = useMeetSelector((state) =>
        snackbar.type === 'event' ? undefined : selectChatMessage(state, snackbar.messageId)
    );

    if (snackbar.type === 'event') {
        return <MeetingUpdateSnackbar update={snackbar.event} onClose={onClose} />;
    }

    if (!message) {
        return null;
    }

    return snackbar.type === 'mention' ? (
        <MentionSnackbar message={message} onClose={onClose} />
    ) : (
        <MeetingUpdateSnackbar update={message} onClose={onClose} />
    );
};
