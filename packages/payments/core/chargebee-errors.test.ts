import { getChargebeeTechnicalError } from './chargebee-errors';

describe('getChargebeeTechnicalError', () => {
    it('should read the message and name out of an iframeAction failure envelope', () => {
        const envelope = {
            type: 'get-height-response',
            correlationId: 'id-3',
            status: 'failure',
            error: { name: 'ChargebeeError', message: 'Fields never mounted' },
        };

        expect(getChargebeeTechnicalError(envelope)).toEqual({
            message: 'Fields never mounted',
            name: 'ChargebeeError',
        });
    });

    it('should read a plain Error thrown on the parent side', () => {
        expect(getChargebeeTechnicalError(new TypeError('Apple Pay session aborted'))).toEqual({
            message: 'Apple Pay session aborted',
            name: 'TypeError',
        });
    });

    it('should return the timeout envelope error, which is a string rather than an object', () => {
        const envelope = { status: 'failure', correlationId: 'id-1', error: 'Timeout exceeded' };

        expect(getChargebeeTechnicalError(envelope)).toEqual({ message: 'Timeout exceeded', name: null });
    });

    it('should prefer the inner error over the envelope around it', () => {
        expect(getChargebeeTechnicalError({ name: 'Envelope', error: { name: 'TypeError' } })).toEqual({
            message: null,
            name: 'TypeError',
        });
    });

    it('should return nulls rather than generic copy when the error carries nothing', () => {
        expect(getChargebeeTechnicalError({ status: 'failure' })).toEqual({ message: null, name: null });
        expect(getChargebeeTechnicalError(undefined)).toEqual({ message: null, name: null });
    });
});
