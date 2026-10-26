import { parseApiModelsResponse } from './apiModels';

const model = {
    object: 'model',
    id: 'lumo-lite',
    name: 'Lumo Lite',
    description: 'Fast, efficient model for everyday tasks.',
    max_context_length: 262144,
    archived: false,
    capabilities: {
        completion_chat: true,
        function_calling: true,
        vision: true,
    },
};

describe('parseApiModelsResponse', () => {
    it('maps active API models to the documentation shape', () => {
        expect(parseApiModelsResponse({ object: 'list', data: [model] })).toEqual([
            {
                id: 'lumo-lite',
                name: 'Lumo Lite',
                description: 'Fast, efficient model for everyday tasks.',
                maxContextLength: 262144,
                capabilities: {
                    completionChat: true,
                    functionCalling: true,
                    vision: true,
                },
            },
        ]);
    });

    it('excludes archived models', () => {
        expect(
            parseApiModelsResponse({
                object: 'list',
                data: [{ ...model, archived: true }],
            })
        ).toEqual([]);
    });

    it('rejects malformed external data', () => {
        expect(() =>
            parseApiModelsResponse({
                object: 'list',
                data: [{ ...model, max_context_length: '262144' }],
            })
        ).toThrow('Invalid model in models response');
    });
});
