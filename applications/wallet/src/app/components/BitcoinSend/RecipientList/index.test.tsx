import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import { WasmRecipient } from '@proton/andromeda';
import { mockUseNotifications } from '@proton/testing/lib/vitest';

import { RecipientList } from '.';
import {
    mockUseUseContactEmailsMap,
    mockUseUserExchangeRate,
    mockUseWalletApi,
    mockUseWalletSettings,
} from '../../../tests';

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

        mockUseUseContactEmailsMap();
        mockUseNotifications();
        mockUseWalletApi();

        mockUseWalletSettings();
        // prevents using fiat currency in amount input
        mockUseUserExchangeRate(null);
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

            expect(removeRecipientButtons).toHaveLength(3);
            const [, secondRemoveRecipientButton] = removeRecipientButtons;

            fireEvent.click(secondRemoveRecipientButton);
            expect(baseProps.onRecipientRemove).toHaveBeenCalledTimes(1);
            expect(baseProps.onRecipientRemove).toHaveBeenCalledWith(1);
        });

        describe('when there is less than 2 recipient', () => {
            it('should remove button disabled', () => {
                const props = { ...baseProps, recipients: [recipients[0]] };
                render(<RecipientList {...props} />);

                const removeRecipientButton = screen.queryByText('Remove recipient');
                expect(removeRecipientButton).toBeDisabled();
            });
        });
    });

    describe('on recipient address change', () => {
        it('should call `onRecipientUpdate` callback with correct index and update', async () => {
            render(<RecipientList {...baseProps} />);

            const addressInputs = screen.getAllByTestId('recipient-address-input-autocomplete');

            expect(addressInputs).toHaveLength(3);
            const [, secondAddressInput] = addressInputs;

            await fireEvent.change(secondAddressInput, { target: { value: 'bc1...helloworld' } });
            await fireEvent.blur(secondAddressInput);

            expect(baseProps.onRecipientUpdate).toHaveBeenCalledTimes(1);
            expect(baseProps.onRecipientUpdate).toHaveBeenCalledWith(1, { address: 'bc1...helloworld' });
        });
    });

    describe('on recipient amount change', () => {
        it('should call `onRecipientAmountUpdate` callback wiht correct index and amount', () => {
            render(<RecipientList {...baseProps} />);

            const amountInputs = screen.getAllByTestId('recipient-amount-input');

            expect(amountInputs).toHaveLength(3);
            const [, , thirdAmountInput] = amountInputs;

            fireEvent.change(thirdAmountInput, { target: { value: 10087 } });
            expect(baseProps.onRecipientUpdate).toHaveBeenCalledTimes(1);
            expect(baseProps.onRecipientUpdate).toHaveBeenCalledWith(2, { amount: 10087 });
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
