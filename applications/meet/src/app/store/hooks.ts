import type { TypedUseSelectorHook } from 'react-redux';

import { baseUseDispatch, baseUseSelector, baseUseStore } from '@proton/react-redux-store';

import type { MeetDispatch, MeetState, MeetStore } from './store';

export const useMeetStore: () => MeetStore = baseUseStore as any;
export const useMeetDispatch: () => MeetDispatch = baseUseDispatch;
export const useMeetSelector: TypedUseSelectorHook<MeetState> = baseUseSelector;
