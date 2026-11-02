import type { Action, Store, ThunkDispatch } from '@reduxjs/toolkit';

import type { AttachmentsStoreState } from '@proton/mail-message/store/attachments/attachmentsTypes';
import type { MessagesStoreState } from '@proton/mail-message/store/messages/messagesTypes';
import { baseUseDispatch, baseUseSelector, baseUseStore } from '@proton/react-redux-store/ProtonStoreContext';
import type { ProtonThunkArguments } from '@proton/redux-shared-store-types/interface';

import type { AddComposerState } from './composers/composerActions';
import type { ComposersStoreState } from './composers/composerTypes';

/** The part of the host application's store that the composer reads. */
export type ComposerStoreState = ComposersStoreState & MessagesStoreState & AttachmentsStoreState & AddComposerState;

export type ComposerDispatch = ThunkDispatch<ComposerStoreState, ProtonThunkArguments, Action>;

export const useComposerDispatch = baseUseDispatch.withTypes<ComposerDispatch>();
export const useComposerSelector = baseUseSelector.withTypes<ComposerStoreState>();
export const useComposerStore = baseUseStore.withTypes<Store<ComposerStoreState>>();
