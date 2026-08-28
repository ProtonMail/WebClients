import { fireEvent, screen } from '@testing-library/react';

import { PLANS } from '@proton/payments/core/constants';
import type { PaymentsApi } from '@proton/payments/core/interface';
import { renderWithProviders } from '@proton/testing/lib/context/renderWithProviders';

import { useTaxCountry } from '../hooks/useTaxCountry';
import { useVatNumber } from '../hooks/useVatNumber';
import { EXPECTED_VAT_ID_COUNTRIES } from '../hooks/vatIdCountries.testdata';
import { VatNumberInput } from './VatNumberInput';

// The only mocked external dependency is the payments API. Everything else — useVatNumber,
// useTaxCountry, useVatFormValidation, the countriesWithVatNumberOnSignup set and the B2B-plan
// gating — runs for real, so this test exercises the same code path as production.
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

    describe('extended billing address fields', () => {
        it('shows extended billing fields when the business checkbox is expanded', () => {
            renderWithProviders(<VatNumberInputHarness countryCode="DE" />);

            fireEvent.click(screen.getByTestId('vat-id-checkbox'));

            expect(screen.getByTestId('vat-id-input')).toBeInTheDocument();
            expect(screen.getByTestId('company-input')).toBeInTheDocument();
            expect(screen.getByTestId('city-input')).toBeInTheDocument();
            expect(screen.getByTestId('street-address-input')).toBeInTheDocument();
            expect(screen.getByTestId('first-name-input')).toBeInTheDocument();
            expect(screen.getByTestId('last-name-input')).toBeInTheDocument();
        });

        it('hides extended billing fields while the business checkbox is collapsed', () => {
            renderWithProviders(<VatNumberInputHarness countryCode="DE" />);

            expect(screen.queryByTestId('vat-id-input')).not.toBeInTheDocument();
            expect(screen.queryByTestId('company-input')).not.toBeInTheDocument();
            expect(screen.queryByTestId('city-input')).not.toBeInTheDocument();
            expect(screen.queryByTestId('street-address-input')).not.toBeInTheDocument();
            expect(screen.queryByTestId('first-name-input')).not.toBeInTheDocument();
            expect(screen.queryByTestId('last-name-input')).not.toBeInTheDocument();
        });
    });
});
