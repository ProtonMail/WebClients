import { TypedUseSelectorHook } from 'react-redux';

import { baseUseDispatch, baseUseSelector, baseUseStore } from '@proton/redux-shared-store';

import type { MailDispatch, MailState, MailStore } from './store';

export const useMailStore: () => MailStore = baseUseStore as any;
export const useMailDispatch: () => MailDispatch = baseUseDispatch;
export const useMailSelector: TypedUseSelectorHook<MailState> = baseUseSelector;
