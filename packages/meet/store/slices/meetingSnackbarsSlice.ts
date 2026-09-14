import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { ParticipantEventRecord } from '../../types/types';
import type { MeetState } from '../rootReducer';
import { removeChatMessage, resetChatAndReactions } from './chatAndReactionsSlice';

const MAX_SNACKBARS = 3;

export const SNACKBAR_TIMEOUT = 8000;

/** Mentions stay longer than other snackbars, but still expire so they can't occupy the screen indefinitely. */
export const MENTION_SNACKBAR_TIMEOUT = 30000;

/** Message snackbars reference chat messages by id; event snackbars carry the event by value. */
export type MeetingSnackbar =
    | { key: string; type: 'mention'; messageId: string }
    | { key: string; type: 'message'; messageId: string }
    | { key: string; type: 'event'; event: ParticipantEventRecord };

interface MeetingSnackbarsState {
    snackbars: MeetingSnackbar[];
}

const initialState: MeetingSnackbarsState = {
    snackbars: [],
};

export const getChatMessageSnackbarKey = (messageId: string) => `message-${messageId}`;

export const getParticipantEventSnackbarKey = (event: ParticipantEventRecord) =>
    `event-${event.identity}-${event.timestamp}`;

const slice = createSlice({
    name: 'meetingSnackbars',
    initialState,
    reducers: {
        pushMeetingSnackbar: (state, action: PayloadAction<MeetingSnackbar>) => {
            if (state.snackbars.some((snackbar) => snackbar.key === action.payload.key)) {
                return;
            }

            // Only mentions stack; every other snackbar shares a single slot.
            if (action.payload.type !== 'mention') {
                state.snackbars = state.snackbars.filter((snackbar) => snackbar.type === 'mention');
            }

            state.snackbars.push(action.payload);

            // Evict non-mentions first; never evict the snackbar that just arrived.
            while (state.snackbars.length > MAX_SNACKBARS) {
                const evictableCount = state.snackbars.length - 1;
                const oldestNonMentionIndex = state.snackbars.findIndex(
                    ({ type }, index) => index < evictableCount && type !== 'mention'
                );

                state.snackbars.splice(oldestNonMentionIndex === -1 ? 0 : oldestNonMentionIndex, 1);
            }
        },
        dismissMeetingSnackbar: (state, action: PayloadAction<string>) => {
            state.snackbars = state.snackbars.filter((snackbar) => snackbar.key !== action.payload);
        },
        clearMeetingSnackbars: (state) => {
            state.snackbars = initialState.snackbars;
        },
    },
    extraReducers: (builder) => {
        // Drop snackbars for messages removed from chat.
        builder.addCase(removeChatMessage, (state, action) => {
            const key = getChatMessageSnackbarKey(action.payload.messageId);
            state.snackbars = state.snackbars.filter((snackbar) => snackbar.key !== key);
        });

        // Snackbars belong to the chat/event stream they were derived from.
        builder.addCase(resetChatAndReactions, () => initialState);
    },
});

export const { pushMeetingSnackbar, dismissMeetingSnackbar, clearMeetingSnackbars } = slice.actions;

export const selectMeetingSnackbars = (state: MeetState) => state.meetingSnackbars.snackbars;

export const meetingSnackbarsReducer = { meetingSnackbars: slice.reducer };
