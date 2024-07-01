import { TypedUseSelectorHook } from 'react-redux';

import { baseUseDispatch, baseUseSelector, baseUseStore } from '@proton/react-redux-store';

import { CalendarDispatch, CalendarState, CalendarStore } from './store';

export const useCalendarStore: () => CalendarStore = baseUseStore as any;
export const useCalendarDispatch: () => CalendarDispatch = baseUseDispatch;
export const useCalendarSelector: TypedUseSelectorHook<CalendarState> = baseUseSelector;
