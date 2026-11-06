import { act } from 'react';

import { renderHook } from '@testing-library/react';

import { useVatPrefixSync } from './useVatPrefixSync';

describe('useVatPrefixSync', () => {
    it('prefills the country prefix on mount when there is no initial VAT', () => {
        const setVatNumber = jest.fn();
        renderHook(() => useVatPrefixSync({ countryCode: 'DE', setVatNumber }));

        expect(setVatNumber).toHaveBeenCalledTimes(1);
        expect(setVatNumber).toHaveBeenCalledWith('DE');
    });

    it('uses the country-specific prefix where it differs from the ISO code', () => {
        const setVatNumber = jest.fn();
        renderHook(() => useVatPrefixSync({ countryCode: 'GR', setVatNumber }));

        expect(setVatNumber).toHaveBeenCalledWith('EL');
    });

    it('prefills an empty string for countries that do not require a prefix', () => {
        const setVatNumber = jest.fn();
        renderHook(() => useVatPrefixSync({ countryCode: 'US', setVatNumber }));

        expect(setVatNumber).toHaveBeenCalledWith('');
    });

    it('leaves the field untouched on mount when an initial VAT is provided', () => {
        const setVatNumber = jest.fn();
        renderHook(() => useVatPrefixSync({ countryCode: 'DE', setVatNumber, initialVatNumber: 'DE123456789' }));

        expect(setVatNumber).not.toHaveBeenCalled();
    });

    it('prefills the new prefix on country change while pristine', () => {
        const setVatNumber = jest.fn();
        const { rerender } = renderHook((props) => useVatPrefixSync(props), {
            initialProps: { countryCode: 'DE', setVatNumber },
        });
        setVatNumber.mockClear();

        rerender({ countryCode: 'FR', setVatNumber });

        expect(setVatNumber).toHaveBeenCalledTimes(1);
        expect(setVatNumber).toHaveBeenCalledWith('FR');
    });

    it('replaces the field on country change even after the user marked it dirty', () => {
        const setVatNumber = jest.fn();
        const { result, rerender } = renderHook((props) => useVatPrefixSync(props), {
            initialProps: { countryCode: 'DE', setVatNumber, initialVatNumber: 'DE123456789' },
        });

        act(() => result.current.markVatNumberDirty());
        rerender({ countryCode: 'FR', setVatNumber, initialVatNumber: 'DE123456789' });

        expect(setVatNumber).toHaveBeenCalledTimes(1);
        expect(setVatNumber).toHaveBeenCalledWith('FR');
    });

    it('does not touch the field when the country has not changed and it is dirty', () => {
        const setVatNumber = jest.fn();
        const { result, rerender } = renderHook((props) => useVatPrefixSync(props), {
            initialProps: { countryCode: 'DE', setVatNumber, initialVatNumber: 'DE123456789' },
        });

        act(() => result.current.markVatNumberDirty());
        rerender({ countryCode: 'DE', setVatNumber, initialVatNumber: 'DE123456789' });

        expect(setVatNumber).not.toHaveBeenCalled();
    });

    it('does nothing while disabled, on mount or on country change', () => {
        const setVatNumber = jest.fn();
        const { rerender } = renderHook((props) => useVatPrefixSync(props), {
            initialProps: { countryCode: 'DE', setVatNumber, enabled: false },
        });

        expect(setVatNumber).not.toHaveBeenCalled();

        rerender({ countryCode: 'FR', setVatNumber, enabled: false });

        expect(setVatNumber).not.toHaveBeenCalled();
    });

    it('does not clobber a user value when re-enabled after a country change happened while disabled', () => {
        const setVatNumber = jest.fn();
        const { rerender } = renderHook((props) => useVatPrefixSync(props), {
            // Disabled with an existing (dirty) VAT for the initial country.
            initialProps: { countryCode: 'DE', setVatNumber, initialVatNumber: 'DE123456789', enabled: false },
        });

        // Country changes while still disabled — the ref must track this transition.
        rerender({ countryCode: 'FR', setVatNumber, initialVatNumber: 'DE123456789', enabled: false });
        // Now re-enable without any further country change.
        rerender({ countryCode: 'FR', setVatNumber, initialVatNumber: 'DE123456789', enabled: true });

        expect(setVatNumber).not.toHaveBeenCalled();
    });
});
