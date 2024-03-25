import { fireEvent, render, screen } from '@testing-library/react';

import TaxCountrySelector, { TaxCountrySelectorProps } from './TaxCountrySelector';

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
