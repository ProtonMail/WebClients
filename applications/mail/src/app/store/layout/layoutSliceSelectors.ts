import { createSelector } from '@reduxjs/toolkit';

import type { MailState } from '../store';

const layout = (state: MailState) => state.layout;

export const selectLayoutIsExpanded = createSelector([layout], (layout) => layout.sidebarExpanded);
export const selectSelectAll = createSelector([layout], (layout) => layout.selectAll);
export const selectDraggingElements = createSelector([layout], (layout) => layout.draggingElements);
export const selectDraggingElementsCount = createSelector([layout], (layout) => layout.draggingElementsCount);
export const selectDraggedMessageID = createSelector([layout], (layout) => layout.draggedMessageID);
