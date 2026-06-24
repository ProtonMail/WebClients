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
