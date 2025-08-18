import { HTTP_ERROR_CODES } from '@proton/shared/lib/errors';
import { createApiError } from '@proton/shared/lib/fetch/ApiError';
import { getNonEmptyErrorMessage } from '@proton/shared/lib/helpers/error';

describe('getNonEmptyErrorMessage', () => {
    describe('should extract the message from api errors', () => {
        describe('whenever there is data', () => {
            const dummyData = { Error: 'Error message', Code: 42, Details: 'Error details' };

            it('for a 401 error', () => {
                const error = createApiError(
                    'InactiveSession',
                    { status: 401, statusText: 'Unauthorized' } as Response,
                    {},
                    dummyData
                );
                expect(getNonEmptyErrorMessage(error)).toEqual('Error message');
            });

            it('for a 404', () => {
                const error = createApiError(
                    'Error',
                    { status: 404, statusText: 'Not found' } as Response,
                    {},
                    dummyData
                );
                expect(getNonEmptyErrorMessage(error)).toEqual('Error message');
            });

            it('for an offline error', () => {
                const error = createApiError('OfflineError', Response.error(), {}, dummyData);
                expect(getNonEmptyErrorMessage(error)).toEqual('Error message');
            });

            it('for a timeout error', () => {
                const error = createApiError('TimeoutError', Response.error(), {}, dummyData);
                expect(getNonEmptyErrorMessage(error)).toEqual('Error message');
            });

            it('for a 502', () => {
                const error = createApiError(
                    'StatusCodeError',
                    { status: HTTP_ERROR_CODES.BAD_GATEWAY, statusText: 'Bad gateway' } as Response,
                    {},
                    dummyData
                );
                expect(getNonEmptyErrorMessage(error)).toEqual('Error message');
            });

            it('for a 503', () => {
                const error = createApiError(
                    'StatusCodeError',
                    { status: HTTP_ERROR_CODES.SERVICE_UNAVAILABLE, statusText: 'Bad gateway' } as Response,
                    {},
                    dummyData
                );
                expect(getNonEmptyErrorMessage(error)).toEqual('Error message');
            });
        });

        describe('without data', () => {
            it('for a 401 error', () => {
                const error = createApiError(
                    'InactiveSession',
                    { status: 401, statusText: 'Unauthorized' } as Response,
                    {}
                );
                expect(getNonEmptyErrorMessage(error)).toEqual('Session timed out');
            });

            it('for a 404', () => {
                const error = createApiError(
                    'Error',
                    { status: 404, statusText: 'Resource not found' } as Response,
                    {}
                );
                expect(getNonEmptyErrorMessage(error)).toEqual('Resource not found');
            });

            it('for an offline error', () => {
                const error = createApiError('OfflineError', Response.error(), {});
                expect(getNonEmptyErrorMessage(error)).toEqual('Internet connection lost');
            });

            it('for a timeout error', () => {
                const error = createApiError('TimeoutError', Response.error(), {});
                expect(getNonEmptyErrorMessage(error)).toEqual('Request timed out');
            });

            it('for a 502', () => {
                const error = createApiError(
                    'StatusCodeError',
                    { status: HTTP_ERROR_CODES.BAD_GATEWAY, statusText: 'Bad gateway' } as Response,
                    {}
                );
                expect(getNonEmptyErrorMessage(error)).toEqual(
                    'Servers are unreachable. Please try again in a few minutes'
                );
            });

            it('for a 503', () => {
                const error = createApiError(
                    'StatusCodeError',
                    { status: HTTP_ERROR_CODES.SERVICE_UNAVAILABLE, statusText: 'Bad gateway' } as Response,
                    {}
                );
                expect(getNonEmptyErrorMessage(error)).toEqual(
                    'Servers are unreachable. Please try again in a few minutes'
                );
            });
        });
    });

    describe('should return the error message from error instances', () => {
        it('for a simple error', () => {
            const error = new Error('Simple error');
            expect(getNonEmptyErrorMessage(error)).toEqual('Simple error');
        });

        it('for a custom error', () => {
            class CustomError extends Error {
                type: number;

                constructor(type: number, message: string) {
                    super(message);
                    this.type = type;
                    Object.setPrototypeOf(this, CustomError.prototype);
                }
            }
            const error = new CustomError(0, 'Custom error');
            expect(getNonEmptyErrorMessage(error)).toEqual('Custom error');
        });
    });

    describe('should return the generic error message', () => {
        it('for an error without message', () => {
            const error = new Error('');
            expect(getNonEmptyErrorMessage(error)).toEqual('Unknown error');
        });

        it('when throwing a string', () => {
            const error = (() => {
                try {
                    throw 'a string';
                } catch (e: any) {
                    return e;
                }
            })();
            expect(error).toEqual('a string');
            expect(getNonEmptyErrorMessage(error)).toEqual('Unknown error');
        });

        it('when throwing undefined', () => {
            const error = (() => {
                try {
                    throw undefined;
                } catch (e: any) {
                    return e;
                }
            })();
            expect(getNonEmptyErrorMessage(error)).toEqual('Unknown error');
        });

        it('when throwing null', () => {
            const error = (() => {
                try {
                    throw null;
                } catch (e: any) {
                    return e;
                }
            })();
            expect(getNonEmptyErrorMessage(error)).toEqual('Unknown error');
        });

        it('when throwing an empty object', () => {
            const error = (() => {
                try {
                    throw {};
                } catch (e: any) {
                    return e;
                }
            })();
            expect(getNonEmptyErrorMessage(error)).toEqual('Unknown error');
        });
    });

    describe('should return the passed custom error message', () => {
        const customMessage = 'Life is a pie';
        it('for an error without message', () => {
            const error = new Error('');
            expect(getNonEmptyErrorMessage(error, customMessage)).toEqual(customMessage);
        });

        it('when throwing a string', () => {
            const error = (() => {
                try {
                    throw 'a string';
                } catch (e: any) {
                    return e;
                }
            })();
            expect(error).toEqual('a string');
            expect(getNonEmptyErrorMessage(error, customMessage)).toEqual(customMessage);
        });

        it('when throwing undefined', () => {
            const error = (() => {
                try {
                    throw undefined;
                } catch (e: any) {
                    return e;
                }
            })();
            expect(getNonEmptyErrorMessage(error, customMessage)).toEqual(customMessage);
        });

        it('when throwing null', () => {
            const error = (() => {
                try {
                    throw null;
                } catch (e: any) {
                    return e;
                }
            })();
            expect(getNonEmptyErrorMessage(error, customMessage)).toEqual(customMessage);
        });

        it('when throwing an empty object', () => {
            const error = (() => {
                try {
                    throw {};
                } catch (e: any) {
                    return e;
                }
            })();
            expect(getNonEmptyErrorMessage(error, customMessage)).toEqual(customMessage);
        });
    });
});
