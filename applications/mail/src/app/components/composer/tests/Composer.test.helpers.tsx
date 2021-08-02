import squire from 'squire-rte';
import { fireEvent, RenderResult } from '@testing-library/react';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { mergeMessages } from '../../../helpers/message/messages';
import { messageCache } from '../../../helpers/test/cache';
import { addApiKeys, apiKeys } from '../../../helpers/test/crypto';
import { MessageExtended, MessageExtendedWithData, PartialMessageExtended } from '../../../models/message';
import Composer from '../Composer';
import { render } from '../../../helpers/test/render';
import { Breakpoints } from '../../../models/utils';
import { addApiMock } from '../../../helpers/test/api';
import { waitForNoNotification, waitForNotification } from '../../../helpers/test/helper';

// Fake timers fails for the complexe send action
// These more manual trick is used to skip undo timing
jest.mock('@proton/shared/lib/helpers/promise', () => {
    return {
        wait: jest.fn(() => {
            return Promise.resolve();
        }),
    };
});

export const getHTML = squire().getHTML as jest.Mock;
export const setHTML = squire().setHTML as jest.Mock;

export const ID = 'ID';
export const AddressID = 'AddressID';
export const fromAddress = 'me@home.net';
export const toAddress = 'someone@somewhere.net';

export const props = {
    messageID: ID,
    composerFrameRef: { current: document.createElement('div') },
    breakpoints: {} as Breakpoints,
    onFocus: jest.fn(),
    onClose: jest.fn(),
    onCompose: jest.fn(),
    toggleMinimized: jest.fn(),
    toggleMaximized: jest.fn(),
    onSubject: jest.fn(),
    isFocused: true,
};

export const prepareMessage = (message: PartialMessageExtended) => {
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
        initialized: true,
    } as MessageExtendedWithData;

    const resultMessage = mergeMessages(baseMessage, message);

    messageCache.set(resultMessage.localID, resultMessage);

    return resultMessage as MessageExtendedWithData;
};

export const renderComposer = async (localID: string, useMinimalCache = true) => {
    const renderResult = await render(<Composer {...props} messageID={localID} />, useMinimalCache);

    // onClose will most likely unmount the component, it has to continue working
    props.onClose.mockImplementation(renderResult.unmount);

    return renderResult;
};

export const clickSend = async (renderResult: RenderResult) => {
    const sendSpy = jest.fn(() => Promise.resolve({ Sent: {} }));
    addApiMock(`mail/v4/messages/${ID}`, sendSpy, 'post');
    addApiMock(`mail/v4/messages/${ID}`, () => {}, 'get');

    const sendButton = await renderResult.findByTestId('composer:send-button');
    fireEvent.click(sendButton);

    await waitForNotification('Message sent');

    const sendRequest = (sendSpy.mock.calls[0] as any[])[0];

    expect(sendRequest.method).toBe('post');

    await waitForNoNotification();

    return sendRequest;
};

export const send = async (message: MessageExtended, useMinimalCache = true) => {
    try {
        if (!apiKeys.has(toAddress)) {
            addApiKeys(false, toAddress, []);
        }

        const renderResult = await renderComposer(message.localID, useMinimalCache);

        return clickSend(renderResult);
    } catch (error) {
        console.log('Error in sending helper', error);
        throw error;
    }
};
