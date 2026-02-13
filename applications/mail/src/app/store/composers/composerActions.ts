import type { ThunkAction, UnknownAction } from '@reduxjs/toolkit';

import type { MailSettingState } from '@proton/mail/store/mailSettings';
import type { Optional } from '@proton/shared/lib/interfaces';
import { COMPOSER_MODE } from '@proton/shared/lib/mail/mailSettings';

import type { MailState } from '../rootReducer';
import type { MailThunkArguments } from '../thunk';
import type { Composer } from './composerTypes';
import { composerActions } from './composersSlice';

const getComposerUID = (() => {
    let current = 0;
    return () => `composer-${current++}`;
})();

type AddComposerActionPayload = Optional<
    Pick<Composer, 'messageID' | 'senderEmailAddress' | 'recipients' | 'status' | 'forceOpenScheduleSend'>,
    'recipients'
> & { ID?: string };

export const addComposerAction = (
    payload: AddComposerActionPayload
): ThunkAction<Promise<void>, MailState & MailSettingState, MailThunkArguments, UnknownAction> => {
    return async (dispatch, getState) => {
        const state = getState();

        const {
            ID = getComposerUID(),
            messageID,
            senderEmailAddress,
            recipients,
            status,
            forceOpenScheduleSend,
        } = payload;

        const composer = {
            ID,
            messageID,
            senderEmailAddress,
            changesCount: 0,
            recipients: {
                ToList: recipients?.ToList || [],
                CCList: recipients?.CCList || [],
                BCCList: recipients?.BCCList || [],
            },
            status,
            forceOpenScheduleSend,
            isMaximized: state.mailSettings.value?.ComposerMode === COMPOSER_MODE.MAXIMIZED,
            isMinimized: false,
        } as Composer;

        dispatch(composerActions.addComposer(composer));
    };
};
