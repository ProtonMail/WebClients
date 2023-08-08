import { render } from '@testing-library/react';

import CheckoutRow, { Props } from './CheckoutRow';

let props: Props;

beforeEach(() => {
    props = {
        title: 'My Checkout Title',
        amount: 999,
    };
});

it('should render', () => {
    const { container } = render(<CheckoutRow {...props} />);

    expect(container).not.toBeEmptyDOMElement();
});

it('should render free if amount is 0 and there is no currency', () => {
    props.amount = 0;
    props.currency = undefined;
    const { container } = render(<CheckoutRow {...props} />);

    expect(container).toHaveTextContent(props.title as string);
    expect(container).toHaveTextContent('Free');
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
    props.suffixNextLine = true;
    const { getByTestId } = render(<CheckoutRow {...props} />);

    expect(getByTestId('next-line-suffix')).toHaveTextContent('/year');
});
