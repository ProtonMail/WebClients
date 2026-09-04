import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';

import type { MeetState } from '../rootReducer';
import { selectIsScreenShare, setParticipantScreenShare } from './screenShareStatusSlice';

export enum ParticipantsLayouts {
    Grid = 'Grid',
    Speaker = 'Speaker',
}

export enum SpotlightSources {
    ActiveSpeaker = 'ActiveSpeaker',
    ScreenShare = 'ScreenShare',
}

export interface LayoutState {
    participantsLayout: ParticipantsLayouts;
    spotlightSource: SpotlightSources;
    layoutBeforeScreenShare: ParticipantsLayouts | null;
    participantSideBarOpen: boolean;
}

export const initialState: LayoutState = {
    participantsLayout: ParticipantsLayouts.Grid,
    spotlightSource: SpotlightSources.ActiveSpeaker,
    layoutBeforeScreenShare: null,
    participantSideBarOpen: true,
};

const slice = createSlice({
    name: 'layout',
    initialState,
    reducers: {
        setParticipantsLayout: (state, action: PayloadAction<ParticipantsLayouts>) => {
            state.participantsLayout = action.payload;
            state.layoutBeforeScreenShare = null;
        },
        setSpotlightSource: (state, action: PayloadAction<SpotlightSources>) => {
            state.spotlightSource = action.payload;
            state.participantsLayout = ParticipantsLayouts.Speaker;
            state.layoutBeforeScreenShare = null;
        },
        toggleParticipantSideBar: (state) => {
            state.participantSideBarOpen = !state.participantSideBarOpen;
        },
        resetLayout: () => initialState,
    },
    extraReducers: (builder) => {
        builder.addCase(setParticipantScreenShare, (state, action) => {
            if (action.payload) {
                if (!state.layoutBeforeScreenShare) {
                    state.layoutBeforeScreenShare = state.participantsLayout;
                }

                state.participantsLayout = ParticipantsLayouts.Speaker;
                state.spotlightSource = SpotlightSources.ScreenShare;
                return;
            }

            state.spotlightSource = SpotlightSources.ActiveSpeaker;

            if (state.layoutBeforeScreenShare) {
                state.participantsLayout = state.layoutBeforeScreenShare;
                state.layoutBeforeScreenShare = null;
            }
        });
    },
});

export const { setParticipantsLayout, setSpotlightSource, toggleParticipantSideBar, resetLayout } = slice.actions;

export const selectParticipantsLayout = (state: MeetState) => state.layout.participantsLayout;
export const selectSpotlightSource = (state: MeetState) => state.layout.spotlightSource;
export const selectParticipantSideBarOpen = (state: MeetState) => state.layout.participantSideBarOpen;
export const selectIsSpotlightLayout = (state: MeetState) =>
    state.layout.participantsLayout === ParticipantsLayouts.Speaker;

/** Both the sidebar render and its page size read this, otherwise the extra tile overflows the slots. */
export const selectShowsScreenShareInSidebar = (state: MeetState) =>
    selectIsSpotlightLayout(state) &&
    state.layout.spotlightSource === SpotlightSources.ActiveSpeaker &&
    selectIsScreenShare(state);

export const layoutReducer = { layout: slice.reducer };
