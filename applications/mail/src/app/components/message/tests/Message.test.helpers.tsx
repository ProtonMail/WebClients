import { MutableRefObject } from 'react';

import { findByTestId, fireEvent, waitFor } from '@testing-library/react';
import { act } from '@testing-library/react';
import loudRejection from 'loud-rejection';

import { MailSettings } from '@proton/shared/lib/interfaces';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import noop from '@proton/utils/noop';

import * as messageDecrypt from '../../../helpers/message/messageDecrypt';
import { mergeMessages } from '../../../helpers/message/messages';
import { render } from '../../../helpers/test/render';
import { MessageState, PartialMessageState } from '../../../logic/messages/messagesTypes';
import { initialize } from '../../../logic/messages/read/messagesReadActions';
import { store } from '../../../logic/store';
import { Breakpoints } from '../../../models/utils';
import MessageView, { MessageViewRef } from '../MessageView';
import { MESSAGE_IFRAME_ROOT_ID } from '../constants';

loudRejection();

export const localID = 'localID';
export const labelID = 'labelID';
export const messageID = 'messageID';
export const addressID = 'AddressID';
export const subject = 'Test subject';
export const body = 'Test body';

export type MessageViewProps = Parameters<typeof MessageView>[0];

export const defaultProps: MessageViewProps = {
    labelID,
    conversationMode: false,
    loading: false,
    labels: [],
    message: { ID: messageID, AddressID: addressID } as Message,
    mailSettings: {} as MailSettings,
    onBack: jest.fn(),
    breakpoints: {} as Breakpoints,
    onFocus: noop,
    isComposerOpened: false,
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
            // Wait for message initialization to be finished before continuing
            await waitFor(() => {
                const message = store.getState().messages[props.message.ID];
                expect(message?.messageDocument?.initialized).toBe(true);
            });
        });
    };

    const details = async () => {
        await act(async () => {
            const button = renderResult.getByTestId('message-show-details');
            fireEvent.click(button);
        });
    };

    const rerender = async (specificProps: Partial<MessageViewProps> = {}) => {
        const props = { ...defaultProps, ...specificProps };
        await renderResult.rerender(<MessageView ref={refCallback} {...props} />);
    };

    return { ...renderResult, ref, open, details, rerender };
};

export const initMessage = (inputMessage: PartialMessageState = {}) => {
    const defaultMessage = {
        localID: messageID,
        data: {
            ID: messageID,
            AddressID: addressID,
            Subject: 'test',
            Sender: { Name: 'testName', Address: 'testAddress' },
        },
        messageDocument: { initialized: true },
        verification: {},
    } as MessageState;

    const message = mergeMessages(defaultMessage, inputMessage);

    store.dispatch(initialize(message));
};

export const getIframeRootDiv = async (element: HTMLElement) => {
    const iframe = (await findByTestId(element, 'content-iframe')) as HTMLIFrameElement;
    const iframeContent = iframe.contentDocument?.getElementById(MESSAGE_IFRAME_ROOT_ID) as HTMLElement;

    return iframeContent;
};
