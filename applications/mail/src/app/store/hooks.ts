import type { TypedUseSelectorHook } from 'react-redux';

import { baseUseDispatch, baseUseSelector, baseUseStore } from '@proton/react-redux-store';

import type { MailDispatch, MailState, MailStore } from 'proton-mail/store/store';

export const useMailStore: () => MailStore = baseUseStore as any;
export const useMailDispatch: () => MailDispatch = baseUseDispatch;
export const useMailSelector: TypedUseSelectorHook<MailState> = baseUseSelector;
