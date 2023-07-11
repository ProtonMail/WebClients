import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import CreditCardNewDesign, { Props } from './CreditCardNewDesign';
import useCard from './useCard';

beforeEach(() => {
    jest.clearAllMocks();
});

const TestComponent = (rest?: Partial<Props>) => {
    const cardHook = useCard();

    return <CreditCardNewDesign {...cardHook} onChange={cardHook.setCard} {...rest} />;
};

it('should render', () => {
    const { container } = render(<TestComponent />);
    expect(container).not.toBeEmptyDOMElement();
});

it('should be not narrow by default', () => {
    const { queryByTestId } = render(<TestComponent />);

    expect(queryByTestId('credit-card-form-container')).toHaveClass('field-two-container');
    expect(queryByTestId('credit-card-form-container')).not.toHaveClass('credit-card-form--narrow');
});

it('should render narrow', () => {
    const { queryByTestId } = render(<TestComponent forceNarrow />);

    expect(queryByTestId('credit-card-form-container')).toHaveClass('field-two-container');
    expect(queryByTestId('credit-card-form-container')).toHaveClass('credit-card-form--narrow');
});

it('should not accept invalid CVC input', () => {
    const { queryByTestId } = render(<TestComponent />);
    const cvcInput = queryByTestId('cvc') as HTMLInputElement;

    userEvent.type(cvcInput, 'abc');

    expect(cvcInput.value).toBe('');
});

describe('autoadvancer', () => {
    it('should move the cursor to the expiration date when credit card number is entered', () => {
        const { queryByTestId } = render(<TestComponent />);
        const ccNumber = queryByTestId('ccnumber') as HTMLInputElement;

        userEvent.type(ccNumber, '4242424242424242');

        const expInput = queryByTestId('exp') as HTMLInputElement;

        expect(expInput).toHaveFocus();
    });

    it('should move the cursor to the cvc when expiration date is entered', () => {
        const { queryByTestId } = render(<TestComponent />);
        const expInput = queryByTestId('exp') as HTMLInputElement;

        userEvent.type(expInput, '1232');

        const cvcInput = queryByTestId('cvc') as HTMLInputElement;

        expect(cvcInput).toHaveFocus();
    });

    it('should move the cursor to the zip when cvc is entered', () => {
        const { queryByTestId } = render(<TestComponent />);
        const cvcInput = queryByTestId('cvc') as HTMLInputElement;

        userEvent.type(cvcInput, '123');

        const zipInput = queryByTestId('postalCode') as HTMLInputElement;

        expect(zipInput).toHaveFocus();
    });

    it('narrow - should move the cursor to the expiration date when credit card number is entered', () => {
        const { queryByTestId } = render(<TestComponent forceNarrow />);
        const ccNumber = queryByTestId('ccnumber') as HTMLInputElement;

        userEvent.type(ccNumber, '4242424242424242');

        const expInput = queryByTestId('exp') as HTMLInputElement;

        expect(expInput).toHaveFocus();
    });

    it('narrow should move the cursor to the cvc when expiration date is entered', () => {
        const { queryByTestId } = render(<TestComponent forceNarrow />);
        const expInput = queryByTestId('exp') as HTMLInputElement;

        userEvent.type(expInput, '1232');

        const cvcInput = queryByTestId('cvc') as HTMLInputElement;

        expect(cvcInput).toHaveFocus();
    });

    it('narrow should move the cursor to the zip when cvc is entered', () => {
        const { queryByTestId } = render(<TestComponent forceNarrow />);
        const cvcInput = queryByTestId('cvc') as HTMLInputElement;

        userEvent.type(cvcInput, '123');

        const zipInput = queryByTestId('postalCode') as HTMLInputElement;

        expect(zipInput).toHaveFocus();
    });

    it('should not move cursor the second time, if user decides to edit the field', () => {
        const { queryByTestId } = render(<TestComponent />);
        const ccNumber = queryByTestId('ccnumber') as HTMLInputElement;

        userEvent.type(ccNumber, '4242424242424242');
        expect(ccNumber.value).toBe('4242 4242 4242 4242'); // formatted

        const expInput = queryByTestId('exp') as HTMLInputElement;
        expect(expInput).toHaveFocus();

        userEvent.click(ccNumber);
        userEvent.type(ccNumber, '4242424242424242');
        expect(ccNumber).toHaveFocus();
    });

    it('should not move the cursor if the credit card number is invalid', () => {
        const { queryByTestId } = render(<TestComponent />);
        const ccNumber = queryByTestId('ccnumber') as HTMLInputElement;

        userEvent.type(ccNumber, '4000000000000000');
        expect(ccNumber.value).toBe('4000 0000 0000 0000'); // formatted

        expect(ccNumber).toHaveFocus();
    });

    it('should not move the cursor if the expiration date is invalid', () => {
        const { queryByTestId } = render(<TestComponent />);
        const expInput = queryByTestId('exp') as HTMLInputElement;

        userEvent.type(expInput, '1211');
        expect(expInput.value).toBe('12/11');

        expect(expInput).toHaveFocus();
    });

    it('should not move the cursor if the cvc is invalid', () => {
        const { queryByTestId } = render(<TestComponent />);
        const cvcInput = queryByTestId('cvc') as HTMLInputElement;

        userEvent.type(cvcInput, '12');

        expect(cvcInput).toHaveFocus();
    });

    it('should move the cursor when user enter correct AmEx card number', () => {
        const { queryByTestId } = render(<TestComponent />);
        const ccNumber = queryByTestId('ccnumber') as HTMLInputElement;

        const num = '374245455400126';
        expect(num.length).toBe(15); // not 16 as for Visa

        userEvent.type(ccNumber, num);
        expect(ccNumber.value).toBe('3742 454554 00126'); // formatted

        const expInput = queryByTestId('exp') as HTMLInputElement;
        expect(expInput).toHaveFocus();
    });

    it('should move the cursor to ZIP when user enter correct AmEx card number and 4-digit security code', () => {
        const { queryByTestId } = render(<TestComponent />);
        const ccNumber = queryByTestId('ccnumber') as HTMLInputElement;

        const num = '374245455400126';
        expect(num.length).toBe(15); // not 16 as for Visa

        userEvent.type(ccNumber, num);

        const expInput = queryByTestId('exp') as HTMLInputElement;
        expect(expInput).toHaveFocus();
        userEvent.type(expInput, '1232');

        const cvcInput = queryByTestId('cvc') as HTMLInputElement;
        expect(cvcInput).toHaveFocus();

        userEvent.type(cvcInput, '1234');

        const zipInput = queryByTestId('postalCode') as HTMLInputElement;
        expect(zipInput).toHaveFocus();
        expect(cvcInput.value).toBe('1234');
    });
});
