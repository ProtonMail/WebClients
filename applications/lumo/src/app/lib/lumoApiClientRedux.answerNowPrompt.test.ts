import type { UnknownAction } from '@reduxjs/toolkit';
import { waitFor } from '@testing-library/react';

import type { AnswerNowPrompt } from '@proton/lumo-api-client/types-api';
import type { Api } from '@proton/shared/lib/interfaces/Api';

import messagesReducer from '../redux/slices/core/messages';
import type { LumoDispatch, LumoState } from '../redux/store';
import { type Message, Role } from '../types';
import { sendMessageWithRedux } from './lumoApiClientRedux';

it.each([false, true])(
    'delivers queue events before the open SSE stream completes (smoothing: %s)',
    async (enableSmoothing) => {
        const message: Message = {
            id: 'message-1',
            conversationId: 'conversation-1',
            createdAt: '2026-10-20',
            role: Role.Assistant,
            placeholder: true,
        };
        let messages = { [message.id]: message };
        const dispatch = jest.fn((action: UnknownAction) => {
            messages = messagesReducer(messages, action);
            return action;
        }) as unknown as LumoDispatch;
        let controller!: ReadableStreamDefaultController<Uint8Array<ArrayBuffer>>;
        const api = jest.fn(
            async () =>
                new ReadableStream<Uint8Array<ArrayBuffer>>({
                    start(streamController) {
                        controller = streamController;
                    },
                })
        ) as unknown as Api;
        const status: AnswerNowPrompt = {
            object: 'lumo.answer_now',
            job_id: '583a48a1-0a3d-465e-a8ba-a1288f6054c2',
            wait: 2988,
        };
        const generation = sendMessageWithRedux(api, [{ role: Role.User, content: 'Hello' }], {
            messageId: message.id,
            conversationId: message.conversationId,
            spaceId: 'space-1',
            config: { enableU2LEncryption: false, enableSmoothing },
        })(dispatch, () => ({ messages, conversations: {} }) as LumoState);
        await waitFor(() => expect(api).toHaveBeenCalled());
        const request = (api as jest.Mock).mock.calls[0][0];
        expect(request.url).toBe('ai/v1/chat/completions');
        expect(request.data.messages).toContainEqual({ role: 'user', content: 'Hello' });
        expect(request.data.lumo).not.toHaveProperty('request_key');
        expect(request.data.lumo).not.toHaveProperty('request_id');
        controller.enqueue(new TextEncoder().encode(`data:${JSON.stringify(status)}\n\n`));
        try {
            await waitFor(() => expect(messages[message.id].answerNowPrompt).toEqual(status));
            expect(messages[message.id].placeholder).toBe(true);
            controller.enqueue(new TextEncoder().encode('data:{"type":"ingesting","target":"title"}\n\n'));
            controller.enqueue(new TextEncoder().encode(`data:${JSON.stringify({ ...status, wait: 2000 })}\n\n`));
            await waitFor(() => expect(messages[message.id].answerNowPrompt?.wait).toBe(2000));
            controller.enqueue(new TextEncoder().encode('data:{"type":"ingesting","target":"message"}\n\n'));
            await waitFor(() => expect(messages[message.id].answerNowPrompt).toBeUndefined());
        } finally {
            controller.enqueue(
                new TextEncoder().encode(
                    'data:{"choices":[{"index":0,"delta":{"content":"Hello"}}]}\n\ndata:[DONE]\n\n'
                )
            );
            controller.close();
            await generation;
            expect(messages[message.id].answerNowPrompt).toBeUndefined();
        }
    }
);
