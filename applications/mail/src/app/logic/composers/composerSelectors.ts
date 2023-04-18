import { createSelector } from 'reselect';

import { RootState } from '../store';

const composers = (state: RootState) => state.composers.composers;

export const selectComposersCount = createSelector([composers], (composers) => Object.values(composers).length);

export const selectComposerMessageIds = createSelector([composers], (composers) =>
    Object.values(composers).map((composer) => composer.messageID)
);
