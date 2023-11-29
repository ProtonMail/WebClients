import { TypedUseSelectorHook } from 'react-redux';

import { baseUseDispatch, baseUseSelector } from '@proton/redux-shared-store';

import { CalendarDispatch, CalendarState } from './store';

export const useCalendarDispatch: () => CalendarDispatch = baseUseDispatch;
export const useCalendarSelector: TypedUseSelectorHook<CalendarState> = baseUseSelector;
