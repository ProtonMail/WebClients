import { createSelector } from 'reselect';

import { RootState } from '../store';
import { ComposerID } from './composerTypes';

const composers = (state: RootState) => state.composers.composers;
const composerID = (_: RootState, ID: ComposerID) => ID;

export const selectComposersCount = createSelector([composers], (composers) => Object.values(composers).length);

export const selectOpenedComposersIds = createSelector([composers], (composers) => {
    const values = Object.values(composers);
    return values.map(({ ID }) => ID);
});

export const selectComposer = createSelector([composers, composerID], (composers, id) => composers[id]);
