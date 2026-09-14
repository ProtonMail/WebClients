import { isAnyOf } from '@reduxjs/toolkit';

import { isRelevantThreadMessage } from '../../utils/isRelevantThreadMessage';
import { isParticipantMentioned } from '../../utils/mentions/mentionToken';
import type { MeetState } from '../rootReducer';
import type { MeetAppStartListening } from '../store';
import { addChatMessages, addEvent, selectChatMessages } from './chatAndReactionsSlice';
import {
    MENTION_SNACKBAR_TIMEOUT,
    SNACKBAR_TIMEOUT,
    clearMeetingSnackbars,
    dismissMeetingSnackbar,
    getChatMessageSnackbarKey,
    getParticipantEventSnackbarKey,
    pushMeetingSnackbar,
} from './meetingSnackbarsSlice';
import { selectLocalParticipantIdentity } from './participants/participantsSlice';
import { selectTotalParticipantCount } from './participants/sortedParticipantsSlice';
import { MeetingSideBars, selectSideBarState } from './uiStateSlice';

/** Skip join/leave snackbars above this participant count. */
const PARTICIPANT_COUNT_THRESHOLD = 5;

const isChatOpen = (state: MeetState) => selectSideBarState(state)[MeetingSideBars.Chat];

export const meetingSnackbarsListener = (startListening: MeetAppStartListening) => {
    startListening({
        matcher: isAnyOf(addChatMessages, addEvent),
        effect: (action, { dispatch, getState, extra }) => {
            const state = getState();

            if (isChatOpen(state)) {
                return;
            }

            const now = Date.now();
            // Skip history replayed on reconnect.
            const isFresh = (timestamp: number) => now - timestamp < SNACKBAR_TIMEOUT;

            if (addEvent.match(action)) {
                if (selectTotalParticipantCount(state) > PARTICIPANT_COUNT_THRESHOLD) {
                    return;
                }

                for (const event of action.payload) {
                    if (!isFresh(event.timestamp)) {
                        continue;
                    }

                    dispatch(
                        pushMeetingSnackbar({
                            key: getParticipantEventSnackbarKey(event),
                            type: 'event',
                            event,
                        })
                    );
                }

                return;
            }

            if (!addChatMessages.match(action)) {
                return;
            }

            const localIdentity = selectLocalParticipantIdentity(state);
            const chatMessages = selectChatMessages(state);
            const isMentionsEnabled = extra.unleashClient.isEnabled('MeetChatMentions');

            for (const message of action.payload) {
                if (!isFresh(message.timestamp) || message.isMissingRoot) {
                    continue;
                }

                const key = getChatMessageSnackbarKey(message.id);

                const isMention =
                    isMentionsEnabled &&
                    message.identity !== localIdentity &&
                    isParticipantMentioned(message.message, localIdentity);

                if (isMention) {
                    dispatch(pushMeetingSnackbar({ key, type: 'mention', messageId: message.id }));
                    continue;
                }

                if (isRelevantThreadMessage(message, chatMessages, localIdentity)) {
                    dispatch(pushMeetingSnackbar({ key, type: 'message', messageId: message.id }));
                }
            }
        },
    });

    // Auto-dismiss every snackbar; mentions just get a longer lifetime.
    startListening({
        actionCreator: pushMeetingSnackbar,
        effect: async ({ payload }, { dispatch, delay }) => {
            await delay(payload.type === 'mention' ? MENTION_SNACKBAR_TIMEOUT : SNACKBAR_TIMEOUT);

            dispatch(dismissMeetingSnackbar(payload.key));
        },
    });

    startListening({
        predicate: (_action, currentState, previousState) => isChatOpen(currentState) && !isChatOpen(previousState),
        effect: (_action, { dispatch }) => {
            dispatch(clearMeetingSnackbars());
        },
    });
};
