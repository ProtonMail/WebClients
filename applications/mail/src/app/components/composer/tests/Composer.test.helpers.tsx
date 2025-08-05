import type { RenderResult } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';

import type { MessageStateWithData, PartialMessageState } from '@proton/mail/store/messages/messagesTypes';
import { pick } from '@proton/shared/lib/helpers/object';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { mockDefaultBreakpoints } from '@proton/testing/lib/mockUseActiveBreakpoint';

import { addComposerAction } from 'proton-mail/store/composers/composerActions';
import type { MailStore } from 'proton-mail/store/store';

import { mergeMessages } from '../../../helpers/message/messages';
import {
    addApiKeys,
    addApiMock,
    apiKeys,
    mailTestRender,
    parseFormData,
    waitForNoNotification,
    waitForNotification,
} from '../../../helpers/test/helper';
import { initialize } from '../../../store/messages/read/messagesReadActions';
import Composer from '../Composer';

// Fake timers fails for the complexe send action
// These more manual trick is used to skip undo timing
jest.mock('@proton/shared/lib/helpers/promise', () => {
    return {
        wait: jest.fn(() => {
            return Promise.resolve();
        }),
    };
});

export const ID = 'ID';
export const AddressID = 'AddressID';
export const fromAddress = 'me@home.net';
export const toAddress = 'someone@somewhere.net';

export const props = {
    composerID: 'ComposerID',
    messageID: ID,
    composerFrameRef: { current: document.body as HTMLDivElement },
    breakpoints: mockDefaultBreakpoints,
    onFocus: jest.fn(),
    onClose: jest.fn(),
    onCompose: jest.fn(),
    toggleMinimized: jest.fn(),
    toggleMaximized: jest.fn(),
    onSubject: jest.fn(),
    isFocused: true,
    minimizeButtonRef: { current: null },
};

export const getMessage = (messageProp: PartialMessageState) => {
    const baseMessage = {
        localID: 'localID',
        data: {
            ID,
            AddressID,
            Subject: 'Subject',
            Sender: { Name: '', Address: fromAddress },
            ToList: [{ Name: '', Address: toAddress }],
            CCList: [],
            BCCList: [],
            Attachments: [],
        } as Partial<Message>,
        messageDocument: {
            initialized: true,
        },
    } as MessageStateWithData;

    return mergeMessages(baseMessage, messageProp) as MessageStateWithData;
};

export const prepareMessage = (store: MailStore, messageProp: PartialMessageState, composerID: string) => {
    const message = getMessage(messageProp);

    store.dispatch(initialize(message));

    void store.dispatch(
        addComposerAction({
            ID: composerID,
            messageID: message.localID,
            senderEmailAddress: message.data?.Sender?.Address || '',
            recipients: message.data
                ? pick(message.data, ['ToList', 'CCList', 'BCCList'])
                : { BCCList: [], CCList: [], ToList: [] },
            status: 'idle',
        })
    );
};

export const renderComposer = async (
    renderOptions: Parameters<typeof mailTestRender>[1] & {
        message: PartialMessageState;
    }
) => {
    const composerID = 'composer-test-id';

    const renderResult = await mailTestRender(<Composer {...props} composerID={composerID} />, {
        ...renderOptions,
        onStore: (store) => {
            prepareMessage(store, renderOptions.message, composerID);
            renderOptions.onStore?.(store);
        },
    });

    // onClose will most likely unmount the component, it has to continue working
    props.onClose.mockImplementation(renderResult.unmount);

    return renderResult;
};

export const clickSend = async (renderResult: RenderResult) => {
    const sendSpy = jest.fn(() => Promise.resolve({ Sent: {} }));
    addApiMock(`mail/v4/messages/${ID}`, sendSpy, 'post');
    addApiMock(`mail/v4/messages/${ID}`, () => {}, 'get');
    addApiMock(`mail/v4/messages/${ID}`, ({ data: { Message } }) => ({ Message }), 'put');

    const sendButton = await renderResult.findByTestId('composer:send-button');
    fireEvent.click(sendButton);

    await waitForNotification('Message sent');

    const sendRequest = (sendSpy.mock.calls[0] as any[])[0];

    expect(sendRequest.method).toBe('post');

    await waitForNoNotification();

    sendRequest.data = parseFormData(sendRequest.data);

    return sendRequest;
};

export const send = async (findByTestId: Parameters<typeof clickSend>[0]) => {
    try {
        if (!apiKeys.has(toAddress)) {
            addApiKeys(false, toAddress, []);
        }

        return await clickSend(findByTestId);
    } catch (error: any) {
        throw error;
    }
};

export const saveNow = async (container: HTMLElement) => {
    fireEvent.keyDown(container, { key: 's', ctrlKey: true });

    // Mandatory to wait on every consequence of the change before starting another test
    // Any better suggestion is welcomed
    await waitForNotification('Draft saved');
};
