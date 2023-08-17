import { createSelector } from 'reselect';

import { RootState } from '../store';

const layout = (state: RootState) => state.layout;

export const selectLayoutIsExpanded = createSelector([layout], (layout) => layout.sidebarExpanded);
