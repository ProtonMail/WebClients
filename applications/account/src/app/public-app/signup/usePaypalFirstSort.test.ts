import { renderHook } from '@testing-library/react';

import { useStaticExperiment } from '@proton/account/staticExperiments/useStaticExperiment';
import { PAYMENT_METHOD_TYPES } from '@proton/payments/core/constants';
import type { AvailablePaymentMethod } from '@proton/payments/core/interface';

import { sortPaypalFirst, usePaypalFirstSort } from './usePaypalFirstSort';

vi.mock('@proton/account/staticExperiments/useStaticExperiment', () => ({ useStaticExperiment: vi.fn() }));

const method = (type: PAYMENT_METHOD_TYPES): AvailablePaymentMethod => ({
    type,
    value: type,
    isSaved: false,
    isDefault: false,
});

const card = method(PAYMENT_METHOD_TYPES.CHARGEBEE_CARD);
const paypal = method(PAYMENT_METHOD_TYPES.CHARGEBEE_PAYPAL);
const sepa = method(PAYMENT_METHOD_TYPES.CHARGEBEE_SEPA_DIRECT_DEBIT);

describe('sortPaypalFirst', () => {
    it('moves PayPal first and keeps the order of the other methods', () => {
        expect(sortPaypalFirst([card, sepa, paypal])).toEqual([paypal, card, sepa]);
    });

    it('keeps the methods as they are without PayPal', () => {
        expect(sortPaypalFirst([card, sepa])).toEqual([card, sepa]);
    });
});

describe('usePaypalFirstSort', () => {
    it('returns the PayPal first sort in the "with" variant', () => {
        vi.mocked(useStaticExperiment).mockReturnValue('with');

        const { result } = renderHook(() => usePaypalFirstSort());

        expect(result.current?.([card, paypal])).toEqual([paypal, card]);
    });

    it.each(['without', 'disabled'] as const)('keeps the default order in the "%s" variant', (variant) => {
        vi.mocked(useStaticExperiment).mockReturnValue(variant);

        const { result } = renderHook(() => usePaypalFirstSort());

        expect(result.current).toBeUndefined();
    });
});
