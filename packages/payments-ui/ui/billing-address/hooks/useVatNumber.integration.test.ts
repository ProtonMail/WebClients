import { act } from 'react';

import { renderHook } from '@testing-library/react';

import { PLANS } from '@proton/payments/core/constants';
import type { PaymentsApi } from '@proton/payments/core/interface';
import { getStoreWrapper } from '@proton/testing/lib/context/renderWithProviders';

import { useTaxCountry } from './useTaxCountry';
import { useVatNumber } from './useVatNumber';
import { EXPECTED_VAT_ID_COUNTRIES } from './vatIdCountries.testdata';

// The only mocked external dependency is the payments API. The B2B-plan gating
// (getIsB2BAudienceFromPlan) and the countriesWithVatNumberOnSignup set run for real, so
// enableVatNumber and renderVatNumberInput are derived exactly as they are in production.
const mockPaymentsApi = {
    getFullBillingAddress: jest.fn().mockResolvedValue({}),
} as unknown as PaymentsApi;

jest.mock('@proton/components/payments/react-extensions/usePaymentsApi', () => ({
    usePaymentsApi: () => ({ paymentsApi: mockPaymentsApi }),
}));

const VALID_DE_VAT = 'DE123456788';

type RenderUseVatNumberOptions = {
    countryCode: string;
    selectedPlanName: PLANS;
    initialVatNumber?: string;
    onBillingAddressChange?: jest.Mock;
};

const renderUseVatNumber = ({
    countryCode,
    selectedPlanName,
    initialVatNumber,
    onBillingAddressChange,
}: RenderUseVatNumberOptions) => {
    const { Wrapper } = getStoreWrapper();
    const hook = renderHook(
        () => {
            const taxCountry = useTaxCountry({
                initialBillingAddress: { CountryCode: countryCode, State: null, ZipCode: null },
                telemetryContext: 'other',
                paymentsApi: mockPaymentsApi,
            });

            return useVatNumber({
                selectedPlanName,
                isAuthenticated: false,
                taxCountry,
                paymentsApi: mockPaymentsApi,
                initialVatNumber,
                onBillingAddressChange,
            });
        },
        { wrapper: Wrapper }
    );

    return {
        ...hook,
        get current() {
            return hook.result.current;
        },
    };
};

describe('useVatNumber integration', () => {
    describe('enableVatNumber', () => {
        it('is true for a B2B plan', () => {
            const vatNumber = renderUseVatNumber({ countryCode: 'DE', selectedPlanName: PLANS.MAIL_PRO });

            expect(vatNumber.current.enableVatNumber).toBe(true);
        });

        it('is false for a consumer plan', () => {
            const vatNumber = renderUseVatNumber({ countryCode: 'DE', selectedPlanName: PLANS.MAIL });

            expect(vatNumber.current.enableVatNumber).toBe(false);
        });
    });

    describe('renderVatNumberInput', () => {
        it.each(EXPECTED_VAT_ID_COUNTRIES)('is true for a B2B plan in %s', (countryCode) => {
            const vatNumber = renderUseVatNumber({ countryCode, selectedPlanName: PLANS.MAIL_PRO });

            expect(vatNumber.current.renderVatNumberInput).toBe(true);
        });

        it('is false for a B2B plan in a country without VAT id support', () => {
            const vatNumber = renderUseVatNumber({ countryCode: 'US', selectedPlanName: PLANS.MAIL_PRO });

            expect(vatNumber.current.renderVatNumberInput).toBe(false);
        });

        it('is false for a consumer plan even in a VAT id country', () => {
            const vatNumber = renderUseVatNumber({ countryCode: 'DE', selectedPlanName: PLANS.MAIL });

            expect(vatNumber.current.renderVatNumberInput).toBe(false);
        });
    });

    // Regression: a hidden VAT form must not block payment. These assertions run the real
    // getVatFormErrors with extended billing address validation enabled.
    describe('vatFormValid while the business form is collapsed', () => {
        it('stays valid for a B2B VAT country when the form is collapsed (no prefix injected)', () => {
            const vatNumber = renderUseVatNumber({ countryCode: 'DE', selectedPlanName: PLANS.MAIL_PRO });

            // Collapsed by default (no billing data): nothing is prefilled, so real validation of an
            // empty VAT number passes and the PayButton is not blocked on a form the user can't see.
            expect(vatNumber.current.vatNumber).toBe('');
            expect(vatNumber.current.vatFormValid).toBe(true);
        });

        it('treats a bare prefix as empty once the form is expanded (does not block the form)', () => {
            const vatNumber = renderUseVatNumber({ countryCode: 'DE', selectedPlanName: PLANS.MAIL_PRO });

            act(() => {
                vatNumber.current.setUnauthenticatedCollapsed(false);
            });

            // Expanding seeds the country prefix. A bare prefix is treated as an empty VAT number,
            // so the form stays valid and nothing incomplete is submitted until the user types the rest.
            expect(vatNumber.current.vatNumber).toBe('DE');
            expect(vatNumber.current.vatNumberToSubmit).toBe('');
            expect(vatNumber.current.vatFormValid).toBe(true);
        });
    });

    describe('extended billing address validation', () => {
        it('marks the form invalid when a VAT number is provided without billing details', () => {
            const vatNumber = renderUseVatNumber({
                countryCode: 'DE',
                selectedPlanName: PLANS.MAIL_PRO,
                initialVatNumber: VALID_DE_VAT,
            });

            expect(vatNumber.current.vatFormValid).toBe(false);
            expect(vatNumber.current.vatFormErrorMessage).toBeTruthy();
        });

        it('marks the form valid when company, address and city are provided with a VAT number', () => {
            const vatNumber = renderUseVatNumber({
                countryCode: 'DE',
                selectedPlanName: PLANS.MAIL_PRO,
                initialVatNumber: VALID_DE_VAT,
            });

            act(() => {
                vatNumber.current.setUnauthenticatedCollapsed(false);
                vatNumber.current.setCompany('Acme GmbH');
                vatNumber.current.setAddress('Main street 12');
                vatNumber.current.setCity('Berlin');
            });

            expect(vatNumber.current.vatFormValid).toBe(true);
            expect(vatNumber.current.vatFormErrorMessage).toBeUndefined();
        });

        it('does not propagate billing address changes while extended fields are incomplete', () => {
            const onBillingAddressChange = jest.fn();
            const vatNumber = renderUseVatNumber({
                countryCode: 'DE',
                selectedPlanName: PLANS.MAIL_PRO,
                initialVatNumber: VALID_DE_VAT,
                onBillingAddressChange,
            });

            act(() => {
                vatNumber.current.setUnauthenticatedCollapsed(false);
                vatNumber.current.setCompany('Acme GmbH');
            });

            expect(onBillingAddressChange).not.toHaveBeenCalled();
        });

        it('propagates billing address changes once all required fields are complete', () => {
            const onBillingAddressChange = jest.fn();
            const vatNumber = renderUseVatNumber({
                countryCode: 'DE',
                selectedPlanName: PLANS.MAIL_PRO,
                initialVatNumber: VALID_DE_VAT,
                onBillingAddressChange,
            });

            act(() => {
                vatNumber.current.setUnauthenticatedCollapsed(false);
                vatNumber.current.setCompany('Acme GmbH');
                vatNumber.current.setAddress('Main street 12');
                vatNumber.current.setCity('Berlin');
            });

            expect(onBillingAddressChange).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    VatId: VALID_DE_VAT,
                    Company: 'Acme GmbH',
                    Address: 'Main street 12',
                    City: 'Berlin',
                })
            );
        });
    });
});
