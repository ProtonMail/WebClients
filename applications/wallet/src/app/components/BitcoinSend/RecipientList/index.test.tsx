import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { RecipientList } from '.';
import { WasmBitcoinUnit, WasmRecipient } from '../../../../pkg';

const buildWasmRecipient = (uuid: string) => {
    return [uuid, '', BigInt(0)] as unknown as WasmRecipient;
};

const recipients: WasmRecipient[] = [buildWasmRecipient('1'), buildWasmRecipient('2'), buildWasmRecipient('3')];

describe('RecipientList', () => {
    let baseProps: Parameters<typeof RecipientList>[0];

    beforeEach(() => {
        baseProps = {
            title: 'Test recipient list',
            recipients,
            onRecipientUpdate: vi.fn(),
            onRecipientAddition: vi.fn(),
            onRecipientRemove: vi.fn(),
            onRecipientMaxAmount: vi.fn(),
        };
    });

    describe('on recipient addition', () => {
        it('should call `onRecipientAddition` callback', () => {
            render(<RecipientList {...baseProps} />);

            const addRecipientButtons = screen.getAllByText('Add recipient');

            // should be only one add button
            expect(addRecipientButtons).toHaveLength(1);
            const [addRecipientButton] = addRecipientButtons;

            fireEvent.click(addRecipientButton);
            expect(baseProps.onRecipientAddition).toHaveBeenCalledTimes(1);
            expect(baseProps.onRecipientAddition).toHaveBeenCalledWith();
        });
    });

    describe('recipient removal', () => {
        it('should call `onRecipientRemove` callback with correct index', () => {
            render(<RecipientList {...baseProps} />);

            const removeRecipientButtons = screen.getAllByText('Remove recipient');

            expect(removeRecipientButtons).toHaveLength(2);
            const [, secondRemoveRecipientButton] = removeRecipientButtons;

            fireEvent.click(secondRemoveRecipientButton);
            expect(baseProps.onRecipientRemove).toHaveBeenCalledTimes(1);
            expect(baseProps.onRecipientRemove).toHaveBeenCalledWith(1);
        });

        describe('when there is less than 2 recipient', () => {
            it('should not have any remove button', () => {
                const props = { ...baseProps, recipients: [recipients[0]] };
                render(<RecipientList {...props} />);

                const removeRecipientButton = screen.queryByText('Remove recipient');
                expect(removeRecipientButton).not.toBeInTheDocument();
            });
        });
    });

    describe('on recipient address change', () => {
        it('should call `onRecipientUpdate` callback with correct index and update', () => {
            render(<RecipientList {...baseProps} />);

            const addressInputs = screen.getAllByTestId('recipient-address-input');

            expect(addressInputs).toHaveLength(3);
            const [, secondAddressInput] = addressInputs;

            fireEvent.change(secondAddressInput, { target: { value: 'bc1...helloworld' } });
            expect(baseProps.onRecipientUpdate).toHaveBeenCalledTimes(1);
            expect(baseProps.onRecipientUpdate).toHaveBeenCalledWith(1, { address: 'bc1...helloworld' });
        });
    });

    describe('on recipient amount change', () => {
        it('should call `onRecipientAmountUpdate` callback wiht correct index and amount', () => {
            render(<RecipientList {...baseProps} />);

            const amountInputs = screen.getAllByTestId('recipient-amount-input');

            expect(amountInputs).toHaveLength(3);
            const [, , thirdAddressInput] = amountInputs;

            fireEvent.change(thirdAddressInput, { target: { value: 10087 } });
            expect(baseProps.onRecipientUpdate).toHaveBeenCalledTimes(1);
            expect(baseProps.onRecipientUpdate).toHaveBeenCalledWith(2, { amount: 10087 });
        });
    });

    describe('on recipient unit display change', () => {
        it('should call `onRecipientUpdate` callback with correct index and update', () => {
            render(<RecipientList {...baseProps} />);

            const btcButtons = screen.getAllByTestId('0-amount-input-unit-button');

            expect(btcButtons).toHaveLength(3);
            const [firstBtcButton] = btcButtons;

            fireEvent.click(firstBtcButton);
            expect(baseProps.onRecipientUpdate).toHaveBeenCalledTimes(1);
            expect(baseProps.onRecipientUpdate).toHaveBeenCalledWith(0, { unit: WasmBitcoinUnit.BTC });
        });
    });

    describe('maximum amount button', () => {
        describe('when there is more than 1 recipients', () => {
            it('should not display `Maximum amount`button', () => {
                render(<RecipientList {...baseProps} />);

                const maxAmountButton = screen.queryByText('Maximum amount');
                expect(maxAmountButton).not.toBeInTheDocument();
            });
        });

        describe('when there is only 1 recipient', () => {
            describe('on button click', () => {
                it("should call `onRecipientAmountUpdate` callback wiht correct index and selectedWallet's balance", () => {
                    const props = { ...baseProps, recipients: [recipients[0]] };
                    render(<RecipientList {...props} />);

                    const maxAmountButton = screen.getByText('Maximum amount');
                    fireEvent.click(maxAmountButton);

                    expect(baseProps.onRecipientMaxAmount).toHaveBeenCalledTimes(1);
                    expect(baseProps.onRecipientMaxAmount).toHaveBeenCalledWith(0);
                });
            });
        });
    });
});
