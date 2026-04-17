import { render, screen } from '@testing-library/react';

import Checkout, { type Props } from './Checkout';

let props: Props;
beforeEach(() => {
    props = {
        currencies: [],
        currency: 'EUR',
        onChangeCurrency: jest.fn(),
        children: <div>children</div>,
        renewNotice: <div>renewNotice</div>,
        disableCurrencySelector: false,
    };
});

it('should render', () => {
    render(<Checkout {...props} />);

    expect(screen.getByText('Summary')).toBeInTheDocument();
});

it('should disable currency selector when disableCurrencySelector is true', () => {
    props.disableCurrencySelector = true;

    render(<Checkout {...props} />);

    expect(screen.getByTestId('currency-selector')).toBeDisabled();
});
