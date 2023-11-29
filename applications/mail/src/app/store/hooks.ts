import { TypedUseSelectorHook } from 'react-redux';

import { baseUseDispatch, baseUseSelector } from '@proton/redux-shared-store';

import { MailDispatch, MailState } from './store';

export const useMailDispatch: () => MailDispatch = baseUseDispatch;
export const useMailSelector: TypedUseSelectorHook<MailState> = baseUseSelector;
