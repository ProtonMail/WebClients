import { createSelector } from '@reduxjs/toolkit';

import type { MailState } from '../store';
import type { ComposerID } from './composerTypes';

const composers = (state: MailState) => state.composers.composers;
const composerID = (_: MailState, ID: ComposerID) => ID;
const hasFocusedComposer = (state: MailState) => state.composers.hasFocusedComposer;

export const selectComposersCount = createSelector([composers], (composers) => Object.values(composers).length);

export const selectOpenedComposersIds = createSelector([composers], (composers) => {
    const values = Object.values(composers);
    return values.map(({ ID }) => ID);
});

export const selectComposer = createSelector([composers, composerID], (composers, id) => composers[id]);

export const selectHasFocusedComposer = hasFocusedComposer;
