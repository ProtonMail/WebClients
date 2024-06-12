import { fireEvent, render, screen } from '@testing-library/react';

import { WasmNetwork, WasmPaymentLink } from '@proton/andromeda';
import { apiWalletsData } from '@proton/wallet';

import { WalletReceiveContent } from '.';
import { mockUseBitcoinBlockchainContext, mockUseWalletAccountExchangeRate } from '../../../tests';
import { mockUseFiatCurrencies } from '../../../tests/mocks/useFiatCurrencies';
import { mockUseGetExchangeRate } from '../../../tests/mocks/useGetExchangeRate';
import * as useBitcoinReceiveModule from './useBitcoinReceive';

describe('WalletReceiveContent', () => {
    let helper: useBitcoinReceiveModule.UseBitcoinReceiveHelper;

    const mockUseBitcoinReceive = vi.spyOn(useBitcoinReceiveModule, 'useBitcoinReceive');

    const [testWallet] = apiWalletsData;
    const [testAccount] = testWallet.WalletAccounts;

    beforeEach(() => {
        mockUseBitcoinBlockchainContext();
        mockUseWalletAccountExchangeRate(null);
        mockUseGetExchangeRate();
        mockUseFiatCurrencies();

        const bitcoinURI = WasmPaymentLink.tryParse(
            'bitcoin:tb1qddqzdcxs9fp0xdd9nfycar58nfcq9s0xpsqf9h?amount=0.005',
            WasmNetwork.Testnet
        );

        helper = {
            paymentLink: bitcoinURI,
            shouldShowAmountInput: false,
            amount: 0,
            loadingPaymentLink: false,
            incrementIndex: vi.fn(),
            isIndexAboveGap: false,
            handleChangeAmount: vi.fn(),
            showAmountInput: vi.fn(),
        };

        mockUseBitcoinReceive.mockReturnValue({ ...helper });
    });

    describe('when payment link is not generated yet', () => {
        beforeEach(() => {
            mockUseBitcoinReceive.mockReturnValue({
                ...helper,
                paymentLink: undefined,
            });

            render(<WalletReceiveContent account={testAccount} />);
        });

        it('should display a loader', () => {
            expect(screen.getByText('Loading')).toBeInTheDocument();
            expect(screen.getByText('Address generation in progress')).toBeInTheDocument();
        });

        it('should disable actions', () => {
            const buttonShare = screen.getByText('Share address');
            expect(buttonShare).toBeDisabled();

            const buttonGenNew = screen.getByText('Generate new address');
            expect(buttonGenNew).toBeDisabled();
        });

        it('should not display amount button', async () => {
            expect(screen.queryByTestId('show-amount-input-button')).toBeNull();
        });
    });

    describe('when new payment link is loading', () => {
        beforeEach(() => {
            mockUseBitcoinReceive.mockReturnValue({
                ...helper,
                loadingPaymentLink: true,
            });

            render(<WalletReceiveContent account={testAccount} />);
        });

        it('should display a loader', () => {
            expect(screen.getByText('Loading')).toBeInTheDocument();
            expect(screen.getByText('Address generation in progress')).toBeInTheDocument();
        });

        it('should disable actions', () => {
            const buttonShare = screen.getByText('Share address');
            expect(buttonShare).toBeDisabled();

            const buttonGenNew = screen.getByText('Generate new address');
            expect(buttonGenNew).toBeDisabled();
        });

        it('should not display amount button', async () => {
            expect(screen.queryByTestId('show-amount-input-button')).toBeNull();
        });
    });

    describe('when user clicks on `Add amount`', () => {
        it('should call `showAmountInput`', async () => {
            render(<WalletReceiveContent account={testAccount} />);

            const button = screen.getByTestId('show-amount-input-button');
            await fireEvent.click(button);

            expect(helper.showAmountInput).toHaveBeenCalledTimes(1);
            expect(helper.showAmountInput).toHaveBeenCalledWith();
        });
    });

    describe('when shouldShowAmountInput is true', () => {
        beforeEach(() => {
            mockUseBitcoinReceive.mockReturnValue({
                ...helper,
                shouldShowAmountInput: true,
            });

            render(<WalletReceiveContent account={testAccount} />);
        });

        it('display amount input', async () => {
            expect(screen.getByTestId('amount-input')).toBeInTheDocument();
        });

        describe('when user type smth in input', () => {
            it('should correctly call `handleChangeAmount`', async () => {
                const input = screen.getByTestId('amount-input');

                await fireEvent.change(input, { target: { value: 124 } });

                expect(helper.handleChangeAmount).toHaveBeenCalledTimes(1);
                expect(helper.handleChangeAmount).toHaveBeenNthCalledWith(1, 124);
            });
        });
    });

    describe('payment info display', () => {
        const bitcoinURI = WasmPaymentLink.tryParse(
            'bitcoin:tb1qddqzdcxs9fp0xdd9nfycar58nfcq9s0xpsqf9h?amount=0.005',
            WasmNetwork.Testnet
        );

        beforeEach(() => {
            mockUseBitcoinReceive.mockReturnValue({
                ...helper,
                paymentLink: bitcoinURI,
            });

            render(<WalletReceiveContent account={testAccount} />);
        });

        it('should display QRCode containing serialized payment info', () => {
            const qrcode = screen.getByTestId('serialized-payment-info-qrcode');
            expect(qrcode.outerHTML).toBe(
                '<svg height="200" width="200" viewBox="0 0 33 33" class="qr-code" data-testid="serialized-payment-info-qrcode"><path fill="#FFFFFF" d="M0,0 h33v33H0z" shape-rendering="crispEdges"></path><path fill="#000000" d="M0 0h7v1H0zM10 0h1v1H10zM12 0h2v1H12zM17 0h1v1H17zM19 0h2v1H19zM22 0h3v1H22zM26,0 h7v1H26zM0 1h1v1H0zM6 1h1v1H6zM8 1h1v1H8zM10 1h1v1H10zM13 1h3v1H13zM18 1h1v1H18zM21 1h1v1H21zM24 1h1v1H24zM26 1h1v1H26zM32,1 h1v1H32zM0 2h1v1H0zM2 2h3v1H2zM6 2h1v1H6zM12 2h1v1H12zM15 2h1v1H15zM18 2h1v1H18zM21 2h2v1H21zM26 2h1v1H26zM28 2h3v1H28zM32,2 h1v1H32zM0 3h1v1H0zM2 3h3v1H2zM6 3h1v1H6zM8 3h3v1H8zM12 3h2v1H12zM15 3h3v1H15zM20 3h1v1H20zM22 3h1v1H22zM24 3h1v1H24zM26 3h1v1H26zM28 3h3v1H28zM32,3 h1v1H32zM0 4h1v1H0zM2 4h3v1H2zM6 4h1v1H6zM9 4h1v1H9zM14 4h1v1H14zM19 4h1v1H19zM23 4h1v1H23zM26 4h1v1H26zM28 4h3v1H28zM32,4 h1v1H32zM0 5h1v1H0zM6 5h1v1H6zM8 5h2v1H8zM11 5h2v1H11zM15 5h2v1H15zM18 5h1v1H18zM20 5h1v1H20zM22 5h1v1H22zM24 5h1v1H24zM26 5h1v1H26zM32,5 h1v1H32zM0 6h7v1H0zM8 6h1v1H8zM10 6h1v1H10zM12 6h1v1H12zM14 6h1v1H14zM16 6h1v1H16zM18 6h1v1H18zM20 6h1v1H20zM22 6h1v1H22zM24 6h1v1H24zM26,6 h7v1H26zM9 7h3v1H9zM15 7h2v1H15zM18 7h2v1H18zM21 7h1v1H21zM0 8h5v1H0zM6 8h4v1H6zM11 8h1v1H11zM13 8h1v1H13zM16 8h2v1H16zM20 8h1v1H20zM22 8h1v1H22zM24 8h2v1H24zM27 8h1v1H27zM29 8h1v1H29zM31 8h1v1H31zM4 9h2v1H4zM7 9h2v1H7zM10 9h1v1H10zM12 9h1v1H12zM14 9h1v1H14zM19 9h3v1H19zM23 9h1v1H23zM25 9h2v1H25zM29 9h1v1H29zM32,9 h1v1H32zM2 10h1v1H2zM4 10h1v1H4zM6 10h1v1H6zM10 10h1v1H10zM15 10h1v1H15zM17 10h2v1H17zM20 10h1v1H20zM22 10h1v1H22zM24 10h1v1H24zM26 10h1v1H26zM29 10h1v1H29zM31 10h1v1H31zM0 11h1v1H0zM4 11h1v1H4zM7 11h2v1H7zM12 11h1v1H12zM15 11h2v1H15zM21 11h1v1H21zM24 11h1v1H24zM26 11h2v1H26zM29,11 h4v1H29zM0 12h3v1H0zM5 12h6v1H5zM12 12h2v1H12zM15 12h3v1H15zM19 12h2v1H19zM22 12h2v1H22zM25 12h1v1H25zM28 12h1v1H28zM2 13h3v1H2zM7 13h2v1H7zM14 13h1v1H14zM16 13h1v1H16zM19 13h1v1H19zM22 13h2v1H22zM26 13h1v1H26zM32,13 h1v1H32zM0 14h1v1H0zM3 14h6v1H3zM11 14h2v1H11zM14 14h2v1H14zM18 14h1v1H18zM20 14h2v1H20zM24 14h2v1H24zM27 14h1v1H27zM29 14h3v1H29zM3 15h3v1H3zM8 15h1v1H8zM10 15h2v1H10zM14 15h1v1H14zM16 15h1v1H16zM21 15h2v1H21zM24 15h1v1H24zM29 15h2v1H29zM0 16h2v1H0zM3 16h4v1H3zM8 16h2v1H8zM11 16h1v1H11zM17 16h1v1H17zM20 16h1v1H20zM22 16h1v1H22zM25 16h1v1H25zM27 16h2v1H27zM31 16h1v1H31zM0 17h1v1H0zM2 17h2v1H2zM5 17h1v1H5zM10 17h1v1H10zM12 17h2v1H12zM16 17h1v1H16zM18 17h4v1H18zM23 17h2v1H23zM26 17h1v1H26zM29 17h1v1H29zM31,17 h2v1H31zM2 18h1v1H2zM4 18h1v1H4zM6 18h4v1H6zM13 18h5v1H13zM20 18h1v1H20zM24 18h1v1H24zM27 18h1v1H27zM31 18h1v1H31zM0 19h6v1H0zM7 19h1v1H7zM9 19h2v1H9zM12 19h2v1H12zM15 19h2v1H15zM18 19h2v1H18zM21 19h2v1H21zM24 19h3v1H24zM30 19h2v1H30zM0 20h1v1H0zM4 20h3v1H4zM10 20h1v1H10zM12 20h1v1H12zM14 20h5v1H14zM22 20h1v1H22zM25 20h1v1H25zM27 20h3v1H27zM32,20 h1v1H32zM0 21h1v1H0zM9 21h2v1H9zM16 21h2v1H16zM19 21h3v1H19zM23 21h1v1H23zM25 21h2v1H25zM32,21 h1v1H32zM0 22h1v1H0zM4 22h1v1H4zM6 22h3v1H6zM10 22h3v1H10zM15 22h2v1H15zM18 22h1v1H18zM21 22h1v1H21zM24 22h1v1H24zM26 22h1v1H26zM31 22h1v1H31zM0 23h1v1H0zM3 23h3v1H3zM8 23h1v1H8zM11 23h1v1H11zM14 23h1v1H14zM16 23h1v1H16zM19 23h5v1H19zM27 23h1v1H27zM29 23h2v1H29zM32,23 h1v1H32zM0 24h1v1H0zM2 24h3v1H2zM6 24h1v1H6zM8 24h4v1H8zM17 24h1v1H17zM22 24h1v1H22zM24 24h6v1H24zM8 25h2v1H8zM12 25h3v1H12zM16 25h7v1H16zM24 25h1v1H24zM28 25h3v1H28zM32,25 h1v1H32zM0 26h7v1H0zM8 26h2v1H8zM13 26h4v1H13zM18 26h1v1H18zM23 26h2v1H23zM26 26h1v1H26zM28 26h1v1H28zM30 26h2v1H30zM0 27h1v1H0zM6 27h1v1H6zM12 27h2v1H12zM15 27h2v1H15zM18 27h4v1H18zM23 27h2v1H23zM28,27 h5v1H28zM0 28h1v1H0zM2 28h3v1H2zM6 28h1v1H6zM8 28h1v1H8zM10 28h1v1H10zM12 28h1v1H12zM14 28h1v1H14zM17 28h3v1H17zM24 28h5v1H24zM31,28 h2v1H31zM0 29h1v1H0zM2 29h3v1H2zM6 29h1v1H6zM8 29h2v1H8zM16 29h2v1H16zM19 29h7v1H19zM28 29h1v1H28zM30,29 h3v1H30zM0 30h1v1H0zM2 30h3v1H2zM6 30h1v1H6zM8 30h5v1H8zM15 30h3v1H15zM21 30h2v1H21zM25 30h2v1H25zM0 31h1v1H0zM6 31h1v1H6zM8 31h1v1H8zM10 31h2v1H10zM14 31h2v1H14zM21 31h3v1H21zM30 31h1v1H30zM0 32h7v1H0zM8 32h1v1H8zM11 32h1v1H11zM15 32h1v1H15zM17 32h1v1H17zM19 32h2v1H19zM24 32h4v1H24zM29 32h1v1H29zM31 32h1v1H31z" shape-rendering="crispEdges"></path></svg>'
            );
        });

        it('should display QRCode containing `paymentLink`', () => {
            expect(screen.getByText(bitcoinURI.toString()));
        });
    });
});
