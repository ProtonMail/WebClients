import { screen } from '@testing-library/react';

import { renderWithProviders } from '@proton/testing/index';

import { PLANS } from '../../../core/constants';
import type { PaymentsApi } from '../../../core/interface';
import { useTaxCountry } from '../hooks/useTaxCountry';
import { useVatNumber } from '../hooks/useVatNumber';
import { EXPECTED_VAT_ID_COUNTRIES } from '../hooks/vatIdCountries.testdata';
import { VatNumberInput } from './VatNumberInput';

// The only mocked boundaries are the two external infrastructure dependencies that the real hooks
// reach for: the Unleash feature flag and the payments API. Everything else — useVatNumber,
// useTaxCountry, useVatFormValidation, the countriesWithVatNumberOnSignup set and the B2B-plan
// gating — runs for real, so this test exercises the same code path as production.
jest.mock('@proton/unleash/useFlag', () => ({
    useFlag: () => false,
}));

const mockPaymentsApi = {
    getFullBillingAddress: jest.fn().mockResolvedValue({}),
} as unknown as PaymentsApi;

jest.mock('@proton/components/payments/react-extensions/usePaymentsApi', () => ({
    usePaymentsApi: () => ({ paymentsApi: mockPaymentsApi }),
}));

const VatNumberInputHarness = ({ countryCode }: { countryCode: string }) => {
    const taxCountry = useTaxCountry({
        initialBillingAddress: { CountryCode: countryCode, State: null, ZipCode: null },
        telemetryContext: 'other',
        paymentsApi: mockPaymentsApi,
    });

    const vatNumber = useVatNumber({
        selectedPlanName: PLANS.MAIL_PRO,
        isAuthenticated: false,
        taxCountry,
        paymentsApi: mockPaymentsApi,
    });

    return <VatNumberInput {...vatNumber} taxCountry={taxCountry} onInlineClick={() => {}} />;
};

describe('VatNumberInput integration', () => {
    it.each(EXPECTED_VAT_ID_COUNTRIES)('renders the vat-id-checkbox for a B2B plan in %s', (countryCode) => {
        renderWithProviders(<VatNumberInputHarness countryCode={countryCode} />);

        expect(screen.getByTestId('vat-id-checkbox')).toBeInTheDocument();
    });
});
