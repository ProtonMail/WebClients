import type { Message } from '../types';
import { getFeedbackTools } from './feedbackTools';

describe('getFeedbackTools', () => {
    it('decorates web searches with their diagnostic source and topic, and web_extract with its source', () => {
        const message = {
            blocks: [
                { type: 'tool_call', content: '{"name":"web_search","arguments":{"query":"weather","topic":"news"}}' },
                {
                    type: 'tool_result',
                    content: '{"results":[]}',
                    meta: { settings: 'a' },
                },
                { type: 'tool_call', content: '{"name":"web_extract","arguments":{"urls":[]}}' },
                {
                    type: 'tool_result',
                    content: '{"results":[]}',
                    meta: { settings: 'c' },
                },
                { type: 'tool_call', content: '{"name":"web_search","arguments":{"query":"cats","topic":"finance"}}' },
                {
                    type: 'tool_result',
                    content: '{"results":[]}',
                    meta: { settings: 'a' },
                },
            ],
        } as Message;

        expect(getFeedbackTools(message)).toEqual(['web_search(a, news)', 'web_extract(c)', 'web_search(a, finance)']);
    });

    it('pairs parallel web searches with their diagnostic metadata by call id', () => {
        const message = {
            blocks: [
                {
                    type: 'tool_call',
                    content: '{"id":"call_0","name":"web_search","arguments":{"query":"weather","topic":"news"}}',
                },
                {
                    type: 'tool_call',
                    content: '{"id":"call_1","name":"web_search","arguments":{"query":"stocks","topic":"finance"}}',
                },
                {
                    type: 'tool_result',
                    content: '{"results":[]}',
                    tool_call_id: 'call_0',
                    meta: { settings: 'a' },
                },
                {
                    type: 'tool_result',
                    content: '{"results":[]}',
                    tool_call_id: 'call_1',
                    meta: { settings: 'b' },
                },
            ],
        } as Message;

        expect(getFeedbackTools(message)).toEqual(['web_search(a, news)', 'web_search(b, finance)']);
    });

    it('defaults the web_search topic to general when the model omitted it', () => {
        const message = {
            blocks: [
                { type: 'tool_call', content: '{"name":"web_search","arguments":{"query":"weather"}}' },
                {
                    type: 'tool_result',
                    content: '{"results":[]}',
                    meta: { settings: 'a' },
                },
            ],
        } as Message;

        expect(getFeedbackTools(message)).toEqual(['web_search(a, general)']);
    });

    it('keeps web_extract undecorated when the result has no diagnostic source', () => {
        const message = {
            blocks: [
                { type: 'tool_call', content: '{"name":"web_extract","arguments":{"urls":[]}}' },
                { type: 'tool_result', content: '{"results":[]}' },
            ],
        } as Message;

        expect(getFeedbackTools(message)).toEqual(['web_extract']);
    });

    it('keeps web_search undecorated when the result has no diagnostic source', () => {
        const message = {
            blocks: [{ type: 'tool_call', content: '{"name":"web_search","arguments":{"query":"weather"}}' }],
        } as Message;

        expect(getFeedbackTools(message)).toEqual(['web_search']);
    });

    it('keeps a failed web_search when a later successful one is decorated', () => {
        const message = {
            blocks: [
                { type: 'tool_call', content: '{"name":"web_search","arguments":{"query":"broken"}}' },
                { type: 'tool_result', content: '{"success":false}' },
                {
                    type: 'tool_call',
                    content: '{"name":"web_search","arguments":{"query":"weather","topic":"news"}}',
                },
                {
                    type: 'tool_result',
                    content: '{"results":[]}',
                    meta: { settings: 'a' },
                },
            ],
        } as Message;

        expect(getFeedbackTools(message)).toEqual(['web_search', 'web_search(a, news)']);
    });
});
