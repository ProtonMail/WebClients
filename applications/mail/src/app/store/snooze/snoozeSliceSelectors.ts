import { createSelector } from 'reselect';

import { MailState } from '../store';

const snooze = (state: MailState) => state.snooze;

export const selectSnoozeElement = createSelector([snooze], (snooze) => snooze.element);
export const selectSnoozeDropdownState = createSelector([snooze], (snooze) => snooze.dropdownState);
