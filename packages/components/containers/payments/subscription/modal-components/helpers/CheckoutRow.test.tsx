import { render } from '@testing-library/react';

import type { Props } from './CheckoutRow';
import CheckoutRow from './CheckoutRow';

let props: Props;

beforeEach(() => {
    props = {
        title: 'My Checkout Title',
        amount: 999,
        currency: 'CHF',
    };
});

it('should render', () => {
    const { container } = render(<CheckoutRow {...props} />);

    expect(container).not.toBeEmptyDOMElement();
});

it('should render loading state', () => {
    props.loading = true;
    const { container } = render(<CheckoutRow {...props} />);

    expect(container).toHaveTextContent(props.title as string);
    expect(container).toHaveTextContent('Loading');
});

it('should render price with suffix', () => {
    props.suffix = '/year';
    props.currency = 'CHF';
    const { container } = render(<CheckoutRow {...props} />);

    expect(container).toHaveTextContent(`My Checkout TitleCHF 9.99/year`);
});

it('should render price with suffix on next line', () => {
    props.suffix = '/year';
    props.currency = 'CHF';
    // that's the default behavior now. No need to set it explicitly.
    // props.suffixNextLine = true;
    const { getByTestId } = render(<CheckoutRow {...props} />);

    expect(getByTestId('next-line-suffix')).toHaveTextContent('/year');
});
