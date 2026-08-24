import { createApiError } from '@proton/shared/lib/fetch/ApiError';
import { getSentryError } from '@proton/shared/lib/helpers/sentry';

import { DisplayablePaymentError } from '../core/errors';

const asResponse = (status: number) => ({ status, statusText: 'error' }) as Response;

/**
 * `getSentryError` is the gate every payments capture passes through: anything it rejects is never
 * reported. These cases pin down what is currently silenced, so that adding a new silencing rule is
 * a deliberate change to this list rather than an invisible loss of signal.
 */
describe('what payments captures silently drop', () => {
    const reported = (exception: unknown) => !!getSentryError(exception);

    it.each([
        ['an offline error', Object.assign(new Error('Offline'), { name: 'OfflineError' })],
        ['a network error', Object.assign(new Error('Network error'), { name: 'NetworkError' })],
        ['a timeout error', Object.assign(new Error('Timed out'), { name: 'TimeoutError' })],
        ['an aborted request', Object.assign(new Error('Aborted'), { name: 'AbortError' })],
        ['a failed fetch', new Error('Failed to fetch')],
        ['a failed load', new Error('Load failed')],
        ['an aborted operation', new Error('Operation aborted')],
        ['an explicitly ignored error', Object.assign(new Error('boom'), { ignore: true })],
        ['a missing error', undefined],
    ])('should drop %s', (_label, exception) => {
        expect(reported(exception)).toBe(false);
    });

    it.each([
        ['a 500 from the api', 500],
        ['a 503 from the api', 503],
    ])('should drop %s as an unreachable-server issue', (_label, status) => {
        expect(reported(createApiError('StatusCodeError', asResponse(status), {}, { Code: 2001, Error: 'nope' }))).toBe(
            false
        );
    });

    it('should report a payment error that carries a real reason', () => {
        expect(reported(new DisplayablePaymentError('Card was declined'))).toBe(true);
    });

    it('should report a Chargebee message bus failure', () => {
        expect(reported({ status: 'failure', error: { code: 'ChargebeeClientError', message: 'nope' } })).toBe(true);
    });

    /**
     * Documents a live gap rather than desired behaviour: the 400..500 range is compared against the
     * api `Code` (a 4-5 digit business code such as 22000), not the http status, so a 4xx rejection
     * with a real business code never reaches Sentry.
     */
    it('should drop a 4xx api rejection because the code is compared against the http range', () => {
        const apiError = createApiError(
            'StatusCodeError',
            asResponse(422),
            {},
            { Code: 22000, Error: 'Invalid coupon code' }
        );

        expect(getSentryError(apiError)).toBeNull();
    });
});
