import type { MutableRefObject } from 'react';

import { act, findByTestId, fireEvent, waitFor } from '@testing-library/react';
import loudRejection from 'loud-rejection';

import { MESSAGE_IFRAME_ROOT_ID } from '@proton/mail-renderer/constants';
import type { MessageState, PartialMessageState } from '@proton/mail/store/messages/messagesTypes';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import noop from '@proton/utils/noop';

import type { MailStore } from 'proton-mail/store/store';

import * as messageDecrypt from '../../../helpers/message/messageDecrypt';
import { mergeMessages } from '../../../helpers/message/messages';
import { mailTestRender, tick } from '../../../helpers/test/render';
import { initialize } from '../../../store/messages/read/messagesReadActions';
import type { MessageViewRef } from '../MessageView';
import MessageView from '../MessageView';

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
    onFocus: noop,
    isComposerOpened: false,
};

export const initMessage = (store: MailStore, message: MessageState) => {
    store.dispatch(initialize(message));
};

export const getMessage = (inputMessage: PartialMessageState = {}) => {
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

    return mergeMessages(defaultMessage, inputMessage);
};

export const setup = async (
    message: PartialMessageState | undefined,
    specificProps: Partial<MessageViewProps> = {},
    renderOptions?: Parameters<typeof mailTestRender>[1]
) => {
    const props = { ...defaultProps, ...specificProps };

    const ref = { current: null } as MutableRefObject<MessageViewRef | null>;
    const refCallback = (refValue: MessageViewRef) => {
        ref.current = refValue;
    };

    const renderResult = await mailTestRender(<MessageView ref={refCallback} {...props} />, {
        ...renderOptions,
        onStore: (store) => {
            if (message) {
                initMessage(store, getMessage(message));
            }
            renderOptions?.onStore?.(store);
        },
    });

    const open = async () => {
        jest.spyOn(messageDecrypt, 'decryptMessage');

        await act(async () => {
            ref.current?.expand();
        });

        // Wait for message initialization to be finished before continuing
        await waitFor(() => {
            const message = renderResult.store.getState().messages[props.message.ID];
            expect(message?.messageDocument?.initialized).toBe(true);
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
        await renderResult.rerender(<MessageView ref={refCallback} {...props} key={props.key} />);
        await tick();
    };

    return { ...renderResult, ref, open, details, rerender };
};

export const getIframeRootDiv = async (element: HTMLElement) => {
    const iframe = (await findByTestId(element, 'content-iframe')) as HTMLIFrameElement;
    const iframeContent = iframe.contentDocument?.getElementById(MESSAGE_IFRAME_ROOT_ID) as HTMLElement;

    return iframeContent;
};
