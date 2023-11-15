import { createSelector } from 'reselect';

import { RootState } from '../store';

const snooze = (state: RootState) => state.snooze;

export const selectSnoozeElement = createSelector([snooze], (snooze) => snooze.element);
export const selectSnoozeDropdownState = createSelector([snooze], (snooze) => snooze.dropdownState);
