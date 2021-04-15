import React from 'react';
import squire from 'squire-rte';
import { act, fireEvent, RenderResult } from '@testing-library/react';
import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import { useEventManager } from 'react-components';
import { mergeMessages } from '../../../helpers/message/messages';
import { messageCache } from '../../../helpers/test/cache';
import { addApiKeys, apiKeys } from '../../../helpers/test/crypto';
import { MessageExtended, MessageExtendedWithData, PartialMessageExtended } from '../../../models/message';
import Composer from '../Composer';
import { render, tick } from '../../../helpers/test/render';
import { Breakpoints } from '../../../models/utils';
import { addApiMock } from '../../../helpers/test/api';
import { waitForSpyCall } from '../../../helpers/test/helper';

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

export const renderComposer = (localID: string, useMinimalCache = true) =>
    render(<Composer {...props} messageID={localID} />, useMinimalCache);

export const clickSend = async (renderResult: RenderResult) => {
    // Fake timers after render, it breaks rendering, I would love to know why
    jest.useFakeTimers();

    const sendSpy = jest.fn(() => Promise.resolve({ Sent: {} }));
    addApiMock(`mail/v4/messages/${ID}`, sendSpy, 'post');
    addApiMock(`mail/v4/messages/${ID}`, () => {}, 'get');

    const sendButton = await renderResult.findByTestId('send-button');
    fireEvent.click(sendButton);

    // Wait for the event manager to be called as it's the last step of the sendMessage hook
    // Hard override of the typing as event manager is mocked
    const { call } = ((useEventManager as any) as () => { call: jest.Mock })();

    await waitForSpyCall(call);

    await act(async () => {
        jest.runAllTimers();
    });

    const sendRequest = (sendSpy.mock.calls[0] as any[])[0];

    expect(sendRequest.method).toBe('post');

    // Blind attempt to solve sending test instabilities
    jest.useRealTimers();
    await tick();

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
