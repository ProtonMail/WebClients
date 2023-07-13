import { act } from 'react-dom/test-utils';

import { RenderResult, fireEvent } from '@testing-library/react';

import { pick } from '@proton/shared/lib/helpers/object';
import { wait } from '@proton/shared/lib/helpers/promise';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';

import { mergeMessages } from '../../../helpers/message/messages';
import {
    addApiKeys,
    addApiMock,
    apiKeys,
    parseFormData,
    render,
    tick,
    waitForNoNotification,
    waitForNotification,
} from '../../../helpers/test/helper';
import { EditorTypes } from '../../../hooks/composer/useComposerContent';
import { composerActions } from '../../../logic/composers/composersSlice';
import { MessageStateWithData, PartialMessageState } from '../../../logic/messages/messagesTypes';
import { initialize } from '../../../logic/messages/read/messagesReadActions';
import { store } from '../../../logic/store';
import { Breakpoints } from '../../../models/utils';
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
    breakpoints: {} as Breakpoints,
    onFocus: jest.fn(),
    onClose: jest.fn(),
    onCompose: jest.fn(),
    toggleMinimized: jest.fn(),
    toggleMaximized: jest.fn(),
    onSubject: jest.fn(),
    isFocused: true,
};

export const prepareMessage = (messageProp: PartialMessageState) => {
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

    const message = mergeMessages(baseMessage, messageProp) as MessageStateWithData;

    store.dispatch(initialize(message));

    store.dispatch(
        composerActions.addComposer({
            messageID: message.localID,
            type: EditorTypes.composer,
            senderEmailAddress: message.data?.Sender?.Address || '',
            recipients: message.data
                ? pick(message.data, ['ToList', 'CCList', 'BCCList'])
                : { BCCList: [], CCList: [], ToList: [] },
        })
    );

    const composerID = Object.keys(store.getState().composers.composers)[0];

    return { message, composerID };
};

export const renderComposer = async (composerID: string, useMinimalCache = true) => {
    const renderResult = await render(<Composer {...props} composerID={composerID} />, useMinimalCache);

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

export const send = async (composerID: string, useMinimalCache = true) => {
    try {
        if (!apiKeys.has(toAddress)) {
            addApiKeys(false, toAddress, []);
        }

        const renderResult = await renderComposer(composerID, useMinimalCache);

        return await clickSend(renderResult);
    } catch (error: any) {
        console.log('Error in sending helper', error);
        throw error;
    }
};

export const saveNow = async (container: HTMLElement) => {
    fireEvent.keyDown(container, { key: 's', ctrlKey: true });
    await tick();

    // Mandatory to wait on every consequence of the change before starting another test
    // Definitely not proud of this, any better suggestion is welcomed
    await act(async () => {
        await wait(3000);
    });
};
