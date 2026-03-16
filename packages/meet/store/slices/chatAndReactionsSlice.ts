import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { MeetChatMessage, ParticipantEventRecord } from '../../types/types';
import type { MeetState } from '../rootReducer';

export interface MeetingChatAndReactionsState {
    chatMessages: MeetChatMessage[];
    events: ParticipantEventRecord[];
    raisedHands: string[];
    activeReactions: Record<string, { emoji: string; timestamp: number }>;
}

const initialState: MeetingChatAndReactionsState = {
    chatMessages: [],
    events: [],
    raisedHands: [],
    activeReactions: {},
};

const slice = createSlice({
    name: 'meetingChatAndReactions',
    initialState,
    reducers: {
        addChatMessages: (state, action: PayloadAction<MeetChatMessage[]>) => {
            state.chatMessages = [...state.chatMessages, ...action.payload];
        },
        markChatMessagesAsSeen: (state) => {
            state.chatMessages = state.chatMessages.map((message) => ({ ...message, seen: true }));
        },
        addChatMessageReaction: (
            state,
            action: PayloadAction<{ messageId: string; emoji: string; identity: string }>
        ) => {
            const msg = state.chatMessages.find((m) => m.id === action.payload.messageId);
            if (!msg) {
                return;
            }
            if (!msg.reactions) {
                msg.reactions = {};
            }
            const existing = msg.reactions[action.payload.emoji] ?? [];
            if (existing.includes(action.payload.identity)) {
                msg.reactions[action.payload.emoji] = existing.filter((id) => id !== action.payload.identity);
                if (msg.reactions[action.payload.emoji].length === 0) {
                    delete msg.reactions[action.payload.emoji];
                }
            } else {
                msg.reactions[action.payload.emoji] = [...existing, action.payload.identity];
            }
        },
        addEvent: (state, action: PayloadAction<ParticipantEventRecord[]>) => {
            state.events = [...state.events, ...action.payload];
        },
        raiseHand: (state, action: PayloadAction<string>) => {
            if (!state.raisedHands.includes(action.payload)) {
                state.raisedHands = [...state.raisedHands, action.payload];
            }
        },
        lowerHand: (state, action: PayloadAction<string>) => {
            state.raisedHands = state.raisedHands.filter((identity) => identity !== action.payload);
            delete state.activeReactions[action.payload];
        },
        setActiveReaction: (state, action: PayloadAction<{ identity: string; emoji: string; timestamp: number }>) => {
            state.activeReactions[action.payload.identity] = {
                emoji: action.payload.emoji,
                timestamp: action.payload.timestamp,
            };
        },
        clearActiveReaction: (state, action: PayloadAction<{ identity: string; timestamp: number }>) => {
            if (state.activeReactions[action.payload.identity]?.timestamp === action.payload.timestamp) {
                delete state.activeReactions[action.payload.identity];
            }
        },
        resetChatAndReactions: (state) => {
            state.chatMessages = initialState.chatMessages;
            state.events = initialState.events;
            state.raisedHands = initialState.raisedHands;
            state.activeReactions = initialState.activeReactions;
        },
    },
});

export const {
    addChatMessages,
    addChatMessageReaction,
    addEvent,
    resetChatAndReactions,
    markChatMessagesAsSeen,
    raiseHand,
    lowerHand,
    setActiveReaction,
    clearActiveReaction,
} = slice.actions;

export const selectChatMessages = (state: MeetState) => {
    return state.meetingChatAndReactions.chatMessages;
};

export const selectEvents = (state: MeetState) => {
    return state.meetingChatAndReactions.events;
};

export const selectRaisedHands = (state: MeetState) => {
    return state.meetingChatAndReactions.raisedHands;
};

export const selectActiveReaction = (state: MeetState, identity: string) => {
    return state.meetingChatAndReactions.activeReactions[identity]?.emoji;
};

export const selectChatMessageReactions = (state: MeetState, messageId: string) => {
    return state.meetingChatAndReactions.chatMessages.find((m) => m.id === messageId)?.reactions ?? {};
};

export const chatAndReactionsReducer = { meetingChatAndReactions: slice.reducer };
