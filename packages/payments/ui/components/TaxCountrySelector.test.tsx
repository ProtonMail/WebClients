import { act, fireEvent, render, screen } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';

import { DEFAULT_TAX_BILLING_ADDRESS } from '../../core/billing-address';
import type { TaxCountrySelectorProps } from './TaxCountrySelector';
import { TaxCountrySelector } from './TaxCountrySelector';
import { useTaxCountry } from './TaxCountrySelector';

const setSelectedCountry = jest.fn();
const setFederalStateCode = jest.fn();

let props: TaxCountrySelectorProps;
beforeEach(() => {
    jest.clearAllMocks();

    props = {
        selectedCountryCode: 'CH',
        setSelectedCountry,
        federalStateCode: null,
        setFederalStateCode,
    };
});

it('should render', () => {
    const { container } = render(<TaxCountrySelector {...props} />);
    expect(container).not.toBeEmptyDOMElement();
});

it.each([
    {
        selectedCountryCode: 'CH',
        federalStateCode: null,
        expectedText: 'Switzerland',
    },
    {
        selectedCountryCode: 'DE',
        federalStateCode: null,
        expectedText: 'Germany',
    },
    {
        selectedCountryCode: 'US',
        federalStateCode: 'AL',
        expectedText: 'United States, Alabama',
    },
    {
        selectedCountryCode: 'US',
        federalStateCode: 'OK',
        expectedText: 'United States, Oklahoma',
    },
    {
        selectedCountryCode: 'CA',
        federalStateCode: 'NL',
        expectedText: 'Canada, Newfoundland and Labrador',
    },
    {
        selectedCountryCode: 'CA',
        federalStateCode: 'AB',
        expectedText: 'Canada, Alberta',
    },
])(
    'should render the collapsed state for $selectedCountryCode $federalStateCode',
    ({ selectedCountryCode, federalStateCode, expectedText }) => {
        render(
            <TaxCountrySelector
                {...props}
                selectedCountryCode={selectedCountryCode}
                federalStateCode={federalStateCode}
            />
        );
        const countryText = screen.getByTestId('billing-country-collapsed');
        expect(countryText).toHaveTextContent(expectedText);
    }
);

it.each([
    {
        countryCode: 'US',
    },
    {
        countryCode: 'CA',
    },
])('should render the expanded state if state is required but not specified: $countryCode', () => {
    render(<TaxCountrySelector {...props} selectedCountryCode="US" />);
    const countryDropdown = screen.getByTestId('tax-country-dropdown');
    expect(countryDropdown).toBeInTheDocument();
    expect(screen.getByText('Select state')).toBeInTheDocument();
    expect(screen.getByTestId('tax-state-dropdown')).toBeInTheDocument();
});

it.each([
    {
        countryCode: 'US',
        federalStateCode: 'AL',
        expectedText: 'United States, Alabama',
    },
    {
        countryCode: 'US',
        federalStateCode: 'OK',
        expectedText: 'United States, Oklahoma',
    },
    {
        countryCode: 'CA',
        federalStateCode: 'NL',
        expectedText: 'Canada, Newfoundland and Labrador',
    },
    {
        countryCode: 'CA',
        federalStateCode: 'AB',
        expectedText: 'Canada, Alberta',
    },
])(
    'should render the expanded state if state is required and specified: $countryCode $federalStateCode',
    async ({ countryCode, federalStateCode, expectedText }) => {
        render(<TaxCountrySelector {...props} selectedCountryCode={countryCode} federalStateCode={federalStateCode} />);

        const countryDropdown = screen.queryByTestId('tax-country-dropdown');
        expect(countryDropdown).toEqual(null);

        const countryText = screen.getByTestId('billing-country-collapsed');
        expect(countryText).toHaveTextContent(expectedText);
    }
);

it('clicking the collapsed element should switch to uncollapsed state and open the dropdown', () => {
    render(<TaxCountrySelector {...props} />);

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

describe('useTaxCountry hook', () => {
    it('should initialize with statusExtended values when provided', () => {
        const { result } = renderHook(() =>
            useTaxCountry({
                statusExtended: {
                    CountryCode: 'US',
                    State: 'CA',
                },
            })
        );

        expect(result.current.selectedCountryCode).toBe('US');
        expect(result.current.federalStateCode).toBe('CA');
    });

    it('should initialize with default values when statusExtended is not provided', () => {
        const { result } = renderHook(() => useTaxCountry({}));

        expect(result.current.selectedCountryCode).toBe(DEFAULT_TAX_BILLING_ADDRESS.CountryCode);
        expect(result.current.federalStateCode).toBe(null);
    });

    it('should update billing address when statusExtended changes', () => {
        const { result, rerender } = renderHook((props) => useTaxCountry(props), {
            initialProps: {
                statusExtended: {
                    CountryCode: 'US',
                    State: 'CA',
                },
            },
        });

        // Initial values
        expect(result.current.selectedCountryCode).toBe('US');
        expect(result.current.federalStateCode).toBe('CA');

        // Update props
        rerender({
            statusExtended: {
                CountryCode: 'CA',
                State: 'ON',
            },
        });

        // Values should be updated
        expect(result.current.selectedCountryCode).toBe('CA');
        expect(result.current.federalStateCode).toBe('ON');
    });

    it('should not update billing address if statusExtended values are the same', () => {
        const onBillingAddressChange = jest.fn();
        const { rerender } = renderHook((props) => useTaxCountry(props), {
            initialProps: {
                statusExtended: {
                    CountryCode: 'US',
                    State: 'CA',
                },
                onBillingAddressChange,
            },
        });

        // Re-render with same values
        rerender({
            statusExtended: {
                CountryCode: 'US',
                State: 'CA',
            },
            onBillingAddressChange,
        });

        // onBillingAddressChange should not be called during initial render if the values are the same
        expect(onBillingAddressChange).toHaveBeenCalledTimes(0);
    });

    it('should call onBillingAddressChange when billing address updates', () => {
        const onBillingAddressChange = jest.fn();
        const { result, rerender } = renderHook(() =>
            useTaxCountry({
                onBillingAddressChange,
                statusExtended: {
                    CountryCode: 'US',
                    State: 'AL',
                },
            })
        );

        // Manually update country
        act(() => {
            result.current.setSelectedCountry('CA');
        });

        rerender();

        expect(onBillingAddressChange).toHaveBeenLastCalledWith({
            CountryCode: 'CA',
            State: 'AB', // First state in Canada's list
        });
    });
});
