import { getVatIdBackendError } from './VatNumberInput';

describe('getVatIdBackendError', () => {
    it('returns AU-specific message for AU + invalid', () => {
        expect(getVatIdBackendError('invalid', 'AU')).toMatch(/ABN/);
    });

    it('returns generic message for non-AU invalid (DE)', () => {
        expect(getVatIdBackendError('invalid', 'DE')).toBe('This field is invalid');
    });

    it('returns generic required message for AU + missing', () => {
        expect(getVatIdBackendError('missing', 'AU')).toBe('This field is required');
    });

    it('returns empty string for ok status', () => {
        expect(getVatIdBackendError('ok', 'AU')).toBe('');
    });

    it('returns empty string for undefined status', () => {
        expect(getVatIdBackendError(undefined, 'AU')).toBe('');
    });

    it('returns empty string for ok status on non-AU', () => {
        expect(getVatIdBackendError('ok', 'DE')).toBe('');
    });
});
