import { fireEvent, RenderResult } from '@testing-library/react';
import { EOInitStore, EOOriginalMessageOptions } from '../../../../helpers/test/eo/helpers';
import { EORender } from '../../../../helpers/test/eo/EORender';
import EOReply from '../EOReply';
import { addApiMock, waitForNoNotification, waitForNotification } from '../../../../helpers/test/helper';

export const setup = async (options?: EOOriginalMessageOptions) => {
    await EOInitStore('reply', options);

    const renderResult = await EORender(<EOReply setSessionStorage={jest.fn()} />, '/eo/reply/:id');

    return renderResult;
};

export const clickSend = async (renderResult: RenderResult) => {
    const sendSpy = jest.fn(() => Promise.resolve({ Reply: {} }));
    addApiMock(`mail/v4/eo/reply`, sendSpy, 'post');

    const sendButton = await renderResult.findByTestId('send-eo');
    fireEvent.click(sendButton);

    await waitForNotification('Message sent');

    const sendRequest = (sendSpy.mock.calls[0] as any[])[0];

    expect(sendRequest.method).toBe('post');

    await waitForNoNotification();

    return sendRequest;
};

export const send = async () => {
    try {
        const renderResult = await setup();

        fireEvent.keyDown(renderResult.container, { key: 'T' });

        return await clickSend(renderResult);
    } catch (error: any) {
        console.log('Error in sending helper', error);
        throw error;
    }
};
