import { getContextLengthExceededUpstreamMessage, isContextLengthExceededApiError } from './contextLengthError';

describe('isContextLengthExceededApiError', () => {
    it('detects verbatim vLLM pre-stream bodies', () => {
        const vllmBody = {
            object: 'error',
            message:
                "This model's maximum context length is 8192 tokens. However, you requested 99999 tokens. Please reduce the length of the messages.",
            type: 'BadRequestError',
            param: null,
            code: 400,
        };

        expect(
            isContextLengthExceededApiError({
                status: 400,
                data: vllmBody,
            })
        ).toBe(true);
    });

    it('does not treat lumo terminal errors as context length', () => {
        expect(
            isContextLengthExceededApiError({
                status: 503,
                data: {
                    error: {
                        message: 'Request was rejected due to high demand. Please try again later.',
                        type: 'server_error',
                        code: 'rejected',
                    },
                },
            })
        ).toBe(false);
    });

    it('does not treat HTTP 429 BadRequestError bodies as context length', () => {
        expect(
            isContextLengthExceededApiError({
                status: 429,
                data: {
                    object: 'error',
                    message: 'Too many requests. Please try again later.',
                    type: 'BadRequestError',
                    code: 429,
                },
            })
        ).toBe(false);
    });

    it('does not treat a generic HTTP 400 BadRequestError as context length', () => {
        expect(
            isContextLengthExceededApiError({
                status: 400,
                data: {
                    object: 'error',
                    message: 'The request is invalid.',
                    type: 'BadRequestError',
                    code: 400,
                },
            })
        ).toBe(false);
    });

    it('requires numeric body code 400 for vLLM BadRequestError bodies', () => {
        expect(
            isContextLengthExceededApiError({
                status: 400,
                data: {
                    object: 'error',
                    message: 'The request exceeds the maximum context length.',
                    type: 'BadRequestError',
                    code: 'context_length_exceeded',
                },
            })
        ).toBe(false);
    });

    it('does not treat explicit context codes on non-400 HTTP responses as pre-stream overflow', () => {
        expect(
            isContextLengthExceededApiError({
                status: 503,
                data: {
                    error: {
                        code: 'context_length_exceeded',
                        message: 'The request exceeds the maximum context length.',
                    },
                },
            })
        ).toBe(false);
    });
});

describe('getContextLengthExceededUpstreamMessage', () => {
    it('reads the upstream message from a vLLM pre-stream body', () => {
        const message =
            "This model's maximum context length is 8192 tokens. However, you requested 99999 tokens. Please reduce the length of the messages.";

        expect(
            getContextLengthExceededUpstreamMessage({
                data: {
                    object: 'error',
                    message,
                    type: 'BadRequestError',
                    param: null,
                    code: 400,
                },
            })
        ).toBe(message);
    });
});
