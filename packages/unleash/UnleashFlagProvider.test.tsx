import type { Api } from '@proton/shared/lib/interfaces';

import { createCustomFetch } from './UnleashFlagProvider';

describe('createCustomFetch', () => {
    let mockApi: jest.MockedFunction<Api>;

    beforeEach(() => {
        mockApi = jest.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({}),
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('config.body parsing', () => {
        it('should parse valid JSON body correctly', async () => {
            const customFetch = createCustomFetch(mockApi);
            const testBody = JSON.stringify({
                appName: 'test-app',
                instanceId: '123',
                bucket: {
                    start: '2024-01-01T00:00:00Z',
                    stop: '2024-01-01T01:00:00Z',
                    toggles: {},
                },
            });

            await customFetch('https://proton.me//client/metrics', {
                method: 'POST',
                body: testBody,
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            expect(mockApi).toHaveBeenCalledWith({
                url: 'feature/v2/frontend/client/metrics',
                silence: true,
                output: 'raw',
                data: {
                    appName: 'test-app',
                    instanceId: '123',
                    bucket: {
                        start: '2024-01-01T00:00:00Z',
                        stop: '2024-01-01T01:00:00Z',
                        toggles: {},
                    },
                },
                headers: {
                    'Content-Type': 'application/json',
                },
                method: 'POST',
                cache: undefined,
            });
        });

        it('should handle empty JSON object body', async () => {
            const customFetch = createCustomFetch(mockApi);
            const testBody = JSON.stringify({});

            await customFetch('https://proton.me//client/metrics', {
                method: 'POST',
                body: testBody,
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            expect(mockApi).toHaveBeenCalledWith({
                url: 'feature/v2/frontend/client/metrics',
                silence: true,
                output: 'raw',
                data: {},
                headers: {
                    'Content-Type': 'application/json',
                },
                method: 'POST',
                cache: undefined,
            });
        });

        it('should handle nested JSON structures', async () => {
            const customFetch = createCustomFetch(mockApi);
            const testBody = JSON.stringify({
                level1: {
                    level2: {
                        level3: {
                            value: 'deep',
                        },
                    },
                    array: [1, 2, 3],
                },
            });

            await customFetch('https://proton.me/test', {
                method: 'POST',
                body: testBody,
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            expect(mockApi).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: {
                        level1: {
                            level2: {
                                level3: {
                                    value: 'deep',
                                },
                            },
                            array: [1, 2, 3],
                        },
                    },
                })
            );
        });

        it('should handle JSON with special characters', async () => {
            const customFetch = createCustomFetch(mockApi);
            const testBody = JSON.stringify({
                message: 'Test with "quotes" and \\backslashes\\',
                emoji: '🚀',
                unicode: '\u00A9',
            });

            await customFetch('https://proton.me/test', {
                method: 'POST',
                body: testBody,
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            expect(mockApi).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: {
                        message: 'Test with "quotes" and \\backslashes\\',
                        emoji: '🚀',
                        unicode: '\u00A9',
                    },
                })
            );
        });

        it('should not parse JSON if content type is not application/json', async () => {
            const customFetch = createCustomFetch(mockApi);
            const testBody = JSON.stringify({
                message: 'Test with "quotes" and \\backslashes\\',
                emoji: '🚀',
                unicode: '\u00A9',
            });

            await customFetch('https://proton.me//client/metrics', {
                method: 'POST',
                body: testBody,
                headers: {
                    'Content-Type': 'application/text',
                },
            });

            expect(mockApi).toHaveBeenCalledWith({
                url: 'feature/v2/frontend/client/metrics',
                silence: true,
                output: 'raw',
                data: undefined,
                method: 'POST',
                cache: undefined,
                headers: {
                    'Content-Type': 'application/text',
                },
            });
        });

        it('should set data to undefined when body parsing fails', async () => {
            const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
            const customFetch = createCustomFetch(mockApi);
            const invalidBody = 'this is not valid JSON {';

            await customFetch('https://proton.me//client/metrics', {
                method: 'POST',
                body: invalidBody,
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            expect(mockApi).toHaveBeenCalledWith({
                url: 'feature/v2/frontend/client/metrics',
                silence: true,
                output: 'raw',
                data: undefined,
                method: 'POST',
                cache: undefined,
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to parse Unleash metrics body', expect.any(Error));

            consoleErrorSpy.mockRestore();
        });

        it('should handle undefined body', async () => {
            const customFetch = createCustomFetch(mockApi);

            await customFetch('https://proton.me//client/features', {
                method: 'GET',
            });

            expect(mockApi).toHaveBeenCalledWith({
                url: 'feature/v2/frontend/client/features',
                silence: true,
                output: 'raw',
                data: undefined,
                headers: undefined,
                method: 'GET',
                cache: undefined,
            });
        });
    });
});
