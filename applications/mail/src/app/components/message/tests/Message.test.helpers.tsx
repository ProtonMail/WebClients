import React, { MutableRefObject } from 'react';
import { noop } from 'proton-shared/lib/helpers/function';
import { MailSettings } from 'proton-shared/lib/interfaces';
import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { act, waitFor } from '@testing-library/react';
import { fireEvent } from '@testing-library/dom';
import loudRejection from 'loud-rejection';
import { render } from '../../../helpers/test/render';
import { Breakpoints } from '../../../models/utils';
import MessageView, { MessageViewRef } from '../MessageView';
import * as messageDecrypt from '../../../helpers/message/messageDecrypt';
import { MessageExtended, PartialMessageExtended } from '../../../models/message';
import { messageCache } from '../../../helpers/test/cache';
import { mergeMessages } from '../../../helpers/message/messages';

loudRejection();

export const localID = 'localID';
export const labelID = 'labelID';
export const messageID = 'messageID';
export const addressID = 'addressID';
export const subject = 'Test subject';
export const body = 'Test body';

export type MessageViewProps = Parameters<typeof MessageView>[0];

export const defaultProps: MessageViewProps = {
    labelID,
    conversationMode: false,
    loading: false,
    labels: [],
    message: { ID: messageID } as Message,
    mailSettings: {} as MailSettings,
    onBack: jest.fn(),
    onCompose: jest.fn(),
    breakpoints: {} as Breakpoints,
    onFocus: noop,
};

export const setup = async (specificProps: Partial<MessageViewProps> = {}, useMinimalCache = true) => {
    const props = { ...defaultProps, ...specificProps };

    const ref = { current: null } as MutableRefObject<MessageViewRef | null>;
    const refCallback = (refValue: MessageViewRef) => {
        ref.current = refValue;
    };

    const renderResult = await render(<MessageView ref={refCallback} {...props} />, useMinimalCache);

    const open = async () => {
        jest.spyOn(messageDecrypt, 'decryptMessage');

        await act(async () => {
            ref.current?.expand();
            // Message decryption can take a bit of time and can be on another thread than the test
            // By waiting on the completion of the decryption, we ensure not to continue too early
            await waitFor(() => expect(messageDecrypt.decryptMessage).toHaveBeenCalled());
        });
    };

    const details = async () => {
        await act(async () => {
            const button = renderResult.getByTestId('message-show-details');
            fireEvent.click(button);
        });
    };

    return { ...renderResult, ref, open, details };
};

export const initMessage = (inputMessage: PartialMessageExtended = {}) => {
    const defaultMessage = {
        localID: messageID,
        data: { ID: messageID, Subject: 'test' },
        initialized: true,
        verification: {},
    } as MessageExtended;

    const message = mergeMessages(defaultMessage, inputMessage);

    messageCache.set(messageID, message);
};
