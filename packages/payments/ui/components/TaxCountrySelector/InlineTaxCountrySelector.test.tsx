import { fireEvent, screen } from '@testing-library/react';

import useConfig from '@proton/components/hooks/useConfig';
import type { PaymentFacade } from '@proton/components/payments/client-extensions';
import { InvalidZipCodeError } from '@proton/components/payments/react-extensions/errors';
import { APPS } from '@proton/shared/lib/constants';
import { renderWithProviders } from '@proton/testing/index';
import useFlag from '@proton/unleash/useFlag';

import type { SubscriptionEstimation } from '../../../core/subscription/interface';
import { type OnBillingAddressChange, useTaxCountry } from '../../hooks/useTaxCountry';
import { InlineTaxCountrySelector } from './InlineTaxCountrySelector';

// Mock the feature flag to be enabled by default for all tests (to match existing test expectations)
jest.mock('@proton/unleash', () => ({
    useFlag: jest.fn().mockReturnValue(true),
    useGetFlag: jest.fn().mockReturnValue(() => true),
}));

// Mock useConfig to provide APP_NAME
jest.mock('@proton/components/hooks/useConfig');

const mockUseFlag = useFlag as jest.MockedFunction<typeof useFlag>;

// Mock useConfig with default APP_NAME
(useConfig as jest.Mock).mockReturnValue({ APP_NAME: APPS.PROTONMAIL });

// Test component that calls the hook and passes the result to InlineTaxCountrySelector
const TestInlineTaxCountrySelector = ({
    initialCountryCode = 'CH',
    initialStateCode = null,
    initialZipCode = null,
    onBillingAddressChange,
    zipCodeValid = true,
    defaultCollapsed = true,
}: {
    initialCountryCode?: string;
    initialStateCode?: string | null;
    initialZipCode?: string | null;
    onBillingAddressChange?: OnBillingAddressChange;
    zipCodeValid?: boolean;
    defaultCollapsed?: boolean;
}) => {
    const zipCodeValidMock = {
        checkResult: { error: zipCodeValid ? undefined : new InvalidZipCodeError() } as SubscriptionEstimation,
    } as PaymentFacade;

    const taxCountry = useTaxCountry({
        paymentStatus: {
            CountryCode: initialCountryCode,
            State: initialStateCode,
            ZipCode: initialZipCode,
        },
        onBillingAddressChange,
        paymentFacade: zipCodeValidMock,
        telemetryContext: 'other',
    });

    return <InlineTaxCountrySelector {...taxCountry} defaultCollapsed={defaultCollapsed} />;
};

describe('InlineTaxCountrySelector component', () => {
    beforeEach(() => {
        // Reset to default (enabled) before each test to match existing test expectations
        mockUseFlag.mockReturnValue(true);
    });

    it('should render', () => {
        const { container } = renderWithProviders(<TestInlineTaxCountrySelector />);
        expect(container).not.toBeEmptyDOMElement();
    });

    it('should render with country dropdown expanded', () => {
        renderWithProviders(<TestInlineTaxCountrySelector defaultCollapsed={false} initialCountryCode="US" />);
        const countryDropdown = screen.getByTestId('tax-country-dropdown');
        expect(countryDropdown).toBeInTheDocument();
    });

    it('should render with country dropdown expanded with country flag', () => {
        renderWithProviders(<TestInlineTaxCountrySelector defaultCollapsed={false} initialCountryCode="US" />);
        const countryDropdown = screen.getByTestId('tax-country-dropdown');
        expect(countryDropdown).toBeInTheDocument();
        expect(screen.getByAltText('United States')).toBeInTheDocument();
    });

    it.each([
        {
            initialCountryCode: 'CH',
            expectedText: 'Switzerland',
        },
        {
            initialCountryCode: 'DE',
            expectedText: 'Germany',
        },
    ])('should render the collapsed state for $initialCountryCode', ({ initialCountryCode, expectedText }) => {
        renderWithProviders(<TestInlineTaxCountrySelector initialCountryCode={initialCountryCode} />);
        const countryText = screen.getByTestId('billing-country-collapsed');
        expect(countryText).toHaveTextContent(expectedText);
    });

    it.each([
        {
            initialCountryCode: 'US',
            initialStateCode: 'AL',
            expectedCountry: 'United States',
            expectedState: 'Alabama',
        },
        {
            initialCountryCode: 'CA',
            initialStateCode: 'AB',
            expectedCountry: 'Canada',
            expectedState: 'Alberta',
        },
    ])(
        'should render the expanded state for countries with states: $initialCountryCode $initialStateCode',
        ({ initialCountryCode, initialStateCode, expectedCountry, expectedState }) => {
            renderWithProviders(
                <TestInlineTaxCountrySelector
                    initialCountryCode={initialCountryCode}
                    initialStateCode={initialStateCode}
                />
            );

            // Countries with states show in expanded state when ZIP is missing
            const countryDropdown = screen.getByTestId('tax-country-dropdown');
            expect(countryDropdown).toBeInTheDocument();
            expect(countryDropdown).toHaveTextContent(expectedCountry);

            const stateDropdown = screen.getByTestId('tax-state-dropdown');
            expect(stateDropdown).toBeInTheDocument();
            expect(stateDropdown).toHaveTextContent(expectedState);

            // ZIP code field should be present
            expect(screen.getByTestId('tax-zip-code')).toBeInTheDocument();
        }
    );

    it('should render the ZIP code in the collapsed state for US states', () => {
        const zipCode = '12345';
        renderWithProviders(
            <TestInlineTaxCountrySelector initialCountryCode="US" initialStateCode="NY" initialZipCode={zipCode} />
        );

        // When all fields are provided (country, state, and ZIP),
        // the component should show in collapsed state
        const countryText = screen.getByTestId('billing-country-collapsed');
        expect(countryText).toBeInTheDocument();
        expect(countryText).toHaveTextContent('United States, New York, 12345');

        // Verify the dropdowns are not shown
        expect(screen.queryByTestId('tax-country-dropdown')).not.toBeInTheDocument();
        expect(screen.queryByTestId('tax-state-dropdown')).not.toBeInTheDocument();
        expect(screen.queryByTestId('tax-zip-code')).not.toBeInTheDocument();
    });

    it('should render collapsed state for Canadian provinces with ZIP code', () => {
        const zipCode = 'A1B 2C3';
        renderWithProviders(
            <TestInlineTaxCountrySelector initialCountryCode="CA" initialStateCode="NL" initialZipCode={zipCode} />
        );

        // When all fields are provided (country, state, and ZIP),
        // the component should show in collapsed state
        const countryText = screen.getByTestId('billing-country-collapsed');
        expect(countryText).toBeInTheDocument();
        expect(countryText).toHaveTextContent('Canada, Newfoundland and Labrador, A1B 2C3');
    });

    it.each([
        {
            countryCode: 'US',
        },
        {
            countryCode: 'CA',
        },
    ])('should render the expanded state if state is required but not specified: $countryCode', ({ countryCode }) => {
        renderWithProviders(<TestInlineTaxCountrySelector initialCountryCode={countryCode} initialStateCode={null} />);
        const countryDropdown = screen.getByTestId('tax-country-dropdown');
        expect(countryDropdown).toBeInTheDocument();
        expect(screen.getByText('Select state')).toBeInTheDocument();
        expect(screen.getByTestId('tax-state-dropdown')).toBeInTheDocument();
    });

    it('clicking the collapsed element should switch to uncollapsed state and open the dropdown', () => {
        renderWithProviders(<TestInlineTaxCountrySelector />);

        const countryText = screen.getByTestId('billing-country-collapsed');
        fireEvent.click(countryText);

        const countryDropdown = screen.getByTestId('tax-country-dropdown');
        expect(countryDropdown).toBeInTheDocument();

        // The countries from the dropdown must appear in the DOM tree
        expect(screen.getByText('Afghanistan')).toBeInTheDocument();
        expect(screen.getByText('Albania')).toBeInTheDocument();
        expect(screen.getByText('Algeria')).toBeInTheDocument();
        expect(screen.getByText('Andorra')).toBeInTheDocument();
        expect(screen.getByText('Angola')).toBeInTheDocument();
    });

    it('should show error message with invalid ZIP error', () => {
        renderWithProviders(
            <TestInlineTaxCountrySelector initialCountryCode="US" initialStateCode="NY" zipCodeValid={false} />
        );

        const zipInput = screen.getByTestId('tax-zip-code');
        expect(zipInput).toBeInTheDocument();

        // Set an invalid ZIP code
        fireEvent.change(zipInput, { target: { value: '123' } });
        fireEvent.focus(zipInput);
        fireEvent.blur(zipInput);

        // The error message should be visible
        const errorMessage = screen.getByTestId('billing-country-error');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveTextContent('Please enter a valid ZIP code');
    });

    it('should show error message for missing country', () => {
        renderWithProviders(<TestInlineTaxCountrySelector initialCountryCode="" />);

        const errorMessage = screen.getByTestId('billing-country-error');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveTextContent('Please select billing country');
    });

    it('should show error message for missing state', () => {
        renderWithProviders(<TestInlineTaxCountrySelector initialCountryCode="US" initialStateCode={null} />);

        const errorMessage = screen.getByTestId('billing-country-error');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveTextContent('Please select billing state');
    });

    it('should show error message for missing ZIP code', () => {
        renderWithProviders(
            <TestInlineTaxCountrySelector initialCountryCode="US" initialStateCode="NY" initialZipCode="" />
        );

        const errorMessage = screen.getByTestId('billing-country-error');
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveTextContent('Please enter ZIP code');
    });
});
