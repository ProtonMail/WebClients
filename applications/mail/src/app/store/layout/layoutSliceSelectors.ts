import { createSelector } from 'reselect';

import type { MailState } from '../store';

const layout = (state: MailState) => state.layout;

export const selectLayoutIsExpanded = createSelector([layout], (layout) => layout.sidebarExpanded);
export const selectSelectAll = createSelector([layout], (layout) => layout.selectAll);
