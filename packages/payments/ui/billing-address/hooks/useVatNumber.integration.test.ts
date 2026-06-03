import { renderHook } from '@testing-library/react';

import { getStoreWrapper } from '@proton/testing/index';

import { PLANS } from '../../../core/constants';
import type { PaymentsApi } from '../../../core/interface';
import { useTaxCountry } from './useTaxCountry';
import { useVatNumber } from './useVatNumber';
import { EXPECTED_VAT_ID_COUNTRIES } from './vatIdCountries.testdata';

// The only mocked boundaries are the two external infrastructure dependencies the real hooks reach
// for: the Unleash feature flag and the payments API. The B2B-plan gating (getIsB2BAudienceFromPlan)
// and the countriesWithVatNumberOnSignup set run for real, so enableVatNumber and
// renderVatNumberInput are derived exactly as they are in production.
jest.mock('@proton/unleash/useFlag', () => ({
    useFlag: () => false,
}));

const mockPaymentsApi = {
    getFullBillingAddress: jest.fn().mockResolvedValue({}),
} as unknown as PaymentsApi;

jest.mock('@proton/components/payments/react-extensions/usePaymentsApi', () => ({
    usePaymentsApi: () => ({ paymentsApi: mockPaymentsApi }),
}));

const renderUseVatNumber = ({ countryCode, selectedPlanName }: { countryCode: string; selectedPlanName: PLANS }) => {
    const { Wrapper } = getStoreWrapper();
    return renderHook(
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
            });
        },
        { wrapper: Wrapper }
    );
};

describe('useVatNumber integration', () => {
    describe('enableVatNumber', () => {
        it('is true for a B2B plan', () => {
            const { result } = renderUseVatNumber({ countryCode: 'DE', selectedPlanName: PLANS.MAIL_PRO });

            expect(result.current.enableVatNumber).toBe(true);
        });

        it('is false for a consumer plan', () => {
            const { result } = renderUseVatNumber({ countryCode: 'DE', selectedPlanName: PLANS.MAIL });

            expect(result.current.enableVatNumber).toBe(false);
        });
    });

    describe('renderVatNumberInput', () => {
        it.each(EXPECTED_VAT_ID_COUNTRIES)('is true for a B2B plan in %s', (countryCode) => {
            const { result } = renderUseVatNumber({ countryCode, selectedPlanName: PLANS.MAIL_PRO });

            expect(result.current.renderVatNumberInput).toBe(true);
        });

        it('is false for a B2B plan in a country without VAT id support', () => {
            const { result } = renderUseVatNumber({ countryCode: 'US', selectedPlanName: PLANS.MAIL_PRO });

            expect(result.current.renderVatNumberInput).toBe(false);
        });

        it('is false for a consumer plan even in a VAT id country', () => {
            const { result } = renderUseVatNumber({ countryCode: 'DE', selectedPlanName: PLANS.MAIL });

            expect(result.current.renderVatNumberInput).toBe(false);
        });
    });
});
