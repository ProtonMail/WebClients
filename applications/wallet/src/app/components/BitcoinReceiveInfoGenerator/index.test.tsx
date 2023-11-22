import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { BitcoinReceiveInfoGenerator } from '.';
import { LightningUriFormat } from '../../types';
import * as useBitcoinReceiveInfoGeneratorModule from './useBitcoinReceiveInfoGenerator';

describe('BitcoinReceiveInfoGenerator', () => {
    let helper: useBitcoinReceiveInfoGeneratorModule.UseBitcoinReceiveInfoGeneratorHelper;

    const mockUseBitcoinReceiveInfoGenerator = jest.spyOn(
        useBitcoinReceiveInfoGeneratorModule,
        'useBitcoinReceiveInfoGenerator'
    );

    beforeEach(() => {
        helper = {
            serializedPaymentInformation: '',
            selectedWallet: { kind: 'lightning', name: 'lightning 01', id: 0, balance: 167 },
            selectedAccount: { name: 'account #1', id: 0 },
            selectedFormat: { name: 'Unified', value: LightningUriFormat.UNIFIED },
            shouldShowAmountInput: false,
            amount: 0,
            handleSelectWallet: jest.fn(),
            handleSelectAccount: jest.fn(),
            handleSelectFormat: jest.fn(),
            handleChangeAmount: jest.fn(),
            showAmountInput: jest.fn(),
        };

        mockUseBitcoinReceiveInfoGenerator.mockReturnValue({ ...helper });
    });

    describe('when a wallet is selected', () => {
        it('should correctly call handler', async () => {
            render(<BitcoinReceiveInfoGenerator />);

            const walletSelector = screen.getByTestId('wallet-selector');
            await act(() => userEvent.click(walletSelector));

            const options = screen.getAllByTestId('wallet-selector-option');
            expect(options).toHaveLength(2);
            await fireEvent.click(options[1]);

            expect(helper.handleSelectWallet).toHaveBeenCalledTimes(1);
            expect(helper.handleSelectWallet).toHaveBeenCalledWith({ selectedIndex: 1, value: 1 });
        });
    });

    describe('when selected wallet is of type `lightning`', () => {
        beforeEach(() => {
            render(<BitcoinReceiveInfoGenerator />);
        });

        it('should display format selector', () => {
            expect(screen.getByTestId('format-selector')).toBeInTheDocument();
        });

        describe('when a format is selected', () => {
            it('should correctly call handler', async () => {
                const formatSelector = screen.getByTestId('format-selector');
                await act(() => userEvent.click(formatSelector));

                const options = screen.getAllByTestId('format-selector-option');
                expect(options).toHaveLength(3);
                await fireEvent.click(options[1]);

                expect(helper.handleSelectFormat).toHaveBeenCalledTimes(1);
                expect(helper.handleSelectFormat).toHaveBeenCalledWith({
                    selectedIndex: 1,
                    value: LightningUriFormat.ONCHAIN,
                });
            });
        });
    });

    describe('when selected wallet is of type `onchain`', () => {
        beforeEach(() => {
            mockUseBitcoinReceiveInfoGenerator.mockReturnValue({
                ...helper,
                selectedWallet: { kind: 'bitcoin', name: 'Bitcoin 01', id: 1, balance: 1783999 },
            });

            render(<BitcoinReceiveInfoGenerator />);
        });

        it('should display account selector', () => {
            expect(screen.getByTestId('account-selector')).toBeInTheDocument();
        });

        describe('when a account is selected', () => {
            it('should correctly call handler', async () => {
                const accountSelector = screen.getByTestId('account-selector');
                await act(() => userEvent.click(accountSelector));

                const options = screen.getAllByTestId('account-selector-option');
                expect(options).toHaveLength(3);
                await fireEvent.click(options[1]);

                expect(helper.handleSelectAccount).toHaveBeenCalledTimes(1);
                expect(helper.handleSelectAccount).toHaveBeenCalledWith({ selectedIndex: 1, value: 1 });
            });
        });
    });

    describe('when user clicks on `Add amount`', () => {
        it('should call `showAmountInput`', async () => {
            render(<BitcoinReceiveInfoGenerator />);

            const button = screen.getByTestId('show-amount-input-button');
            await fireEvent.click(button);

            expect(helper.showAmountInput).toHaveBeenCalledTimes(1);
            expect(helper.showAmountInput).toHaveBeenCalledWith();
        });
    });

    describe('when shouldShowAmountInput is true', () => {
        beforeEach(() => {
            mockUseBitcoinReceiveInfoGenerator.mockReturnValue({
                ...helper,
                shouldShowAmountInput: true,
            });

            render(<BitcoinReceiveInfoGenerator />);
        });

        it('should call `showAmountInput`', async () => {
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
        const bitcoinURI = 'bitcoin:1M3sbwFcmFRRqE7FbKt8k1YdmKdGM6FxmZ?amount=0.005';

        beforeEach(() => {
            mockUseBitcoinReceiveInfoGenerator.mockReturnValue({
                ...helper,
                serializedPaymentInformation: bitcoinURI,
            });

            render(<BitcoinReceiveInfoGenerator />);
        });
        it('should display QRCode containing serialized payment info', () => {
            const qrcode = screen.getByTestId('serialized-payment-info-qrcode');
            expect(qrcode.outerHTML).toBe(
                '<svg height="200" width="200" viewBox="0 0 33 33" class="qr-code" data-testid="serialized-payment-info-qrcode"><path fill="#FFFFFF" d="M0,0 h33v33H0z" shape-rendering="crispEdges"></path><path fill="#000000" d="M0 0h7v1H0zM9 0h4v1H9zM14 0h1v1H14zM18 0h1v1H18zM20 0h1v1H20zM22 0h2v1H22zM26,0 h7v1H26zM0 1h1v1H0zM6 1h1v1H6zM9 1h1v1H9zM11 1h1v1H11zM15 1h2v1H15zM18 1h1v1H18zM20 1h3v1H20zM24 1h1v1H24zM26 1h1v1H26zM32,1 h1v1H32zM0 2h1v1H0zM2 2h3v1H2zM6 2h1v1H6zM8 2h2v1H8zM11 2h2v1H11zM14 2h1v1H14zM18 2h1v1H18zM21 2h4v1H21zM26 2h1v1H26zM28 2h3v1H28zM32,2 h1v1H32zM0 3h1v1H0zM2 3h3v1H2zM6 3h1v1H6zM8 3h1v1H8zM11 3h2v1H11zM17 3h2v1H17zM20 3h1v1H20zM22 3h1v1H22zM24 3h1v1H24zM26 3h1v1H26zM28 3h3v1H28zM32,3 h1v1H32zM0 4h1v1H0zM2 4h3v1H2zM6 4h1v1H6zM8 4h2v1H8zM11 4h2v1H11zM14 4h3v1H14zM19 4h1v1H19zM21 4h1v1H21zM23 4h1v1H23zM26 4h1v1H26zM28 4h3v1H28zM32,4 h1v1H32zM0 5h1v1H0zM6 5h1v1H6zM8 5h3v1H8zM12 5h1v1H12zM22 5h1v1H22zM26 5h1v1H26zM32,5 h1v1H32zM0 6h7v1H0zM8 6h1v1H8zM10 6h1v1H10zM12 6h1v1H12zM14 6h1v1H14zM16 6h1v1H16zM18 6h1v1H18zM20 6h1v1H20zM22 6h1v1H22zM24 6h1v1H24zM26,6 h7v1H26zM8 7h1v1H8zM10 7h1v1H10zM12 7h1v1H12zM14 7h1v1H14zM16 7h1v1H16zM19 7h4v1H19zM24 7h1v1H24zM0 8h1v1H0zM2 8h5v1H2zM11 8h2v1H11zM14 8h1v1H14zM17 8h6v1H17zM24 8h1v1H24zM26 8h5v1H26zM1 9h3v1H1zM7 9h1v1H7zM9 9h1v1H9zM13 9h2v1H13zM16 9h1v1H16zM19 9h2v1H19zM23 9h1v1H23zM25 9h3v1H25zM1 10h1v1H1zM4 10h1v1H4zM6 10h2v1H6zM9 10h2v1H9zM13 10h3v1H13zM18 10h1v1H18zM22 10h1v1H22zM25 10h1v1H25zM27 10h5v1H27zM2 11h3v1H2zM7 11h1v1H7zM9 11h1v1H9zM11 11h1v1H11zM13 11h1v1H13zM15 11h1v1H15zM18 11h2v1H18zM21 11h4v1H21zM26 11h1v1H26zM28 11h4v1H28zM1 12h1v1H1zM3 12h2v1H3zM6 12h3v1H6zM10 12h1v1H10zM14 12h1v1H14zM16 12h3v1H16zM22 12h1v1H22zM24 12h2v1H24zM27 12h1v1H27zM29 12h1v1H29zM31,12 h2v1H31zM0 13h3v1H0zM4 13h2v1H4zM8 13h2v1H8zM15 13h1v1H15zM19 13h1v1H19zM21 13h3v1H21zM25 13h2v1H25zM32,13 h1v1H32zM1 14h2v1H1zM6 14h2v1H6zM9 14h2v1H9zM15 14h3v1H15zM22 14h1v1H22zM26 14h4v1H26zM31 14h1v1H31zM3 15h2v1H3zM8 15h3v1H8zM12 15h4v1H12zM21 15h1v1H21zM23 15h1v1H23zM26 15h1v1H26zM29 15h2v1H29zM32,15 h1v1H32zM2 16h2v1H2zM5 16h3v1H5zM11 16h2v1H11zM14 16h3v1H14zM20 16h1v1H20zM22 16h2v1H22zM27 16h2v1H27zM0 17h5v1H0zM8 17h3v1H8zM13 17h2v1H13zM18 17h1v1H18zM20 17h2v1H20zM23 17h1v1H23zM25 17h2v1H25zM29 17h2v1H29zM32,17 h1v1H32zM0 18h5v1H0zM6 18h1v1H6zM9 18h1v1H9zM11 18h2v1H11zM15 18h1v1H15zM21 18h2v1H21zM26 18h1v1H26zM30 18h2v1H30zM0 19h2v1H0zM3 19h1v1H3zM8 19h2v1H8zM11 19h2v1H11zM15 19h2v1H15zM19 19h1v1H19zM21 19h4v1H21zM27 19h4v1H27zM1 20h1v1H1zM4 20h1v1H4zM6 20h1v1H6zM10 20h2v1H10zM14 20h2v1H14zM18 20h1v1H18zM20 20h1v1H20zM22 20h1v1H22zM25 20h1v1H25zM28 20h1v1H28zM31 20h1v1H31zM0 21h4v1H0zM9 21h2v1H9zM15 21h2v1H15zM18 21h2v1H18zM21 21h1v1H21zM23 21h2v1H23zM26 21h2v1H26zM29 21h2v1H29zM32,21 h1v1H32zM0 22h1v1H0zM2 22h1v1H2zM4 22h3v1H4zM9 22h1v1H9zM11 22h1v1H11zM17 22h1v1H17zM20 22h1v1H20zM24 22h1v1H24zM30 22h2v1H30zM0 23h1v1H0zM2 23h1v1H2zM4 23h1v1H4zM10 23h1v1H10zM12 23h1v1H12zM16 23h1v1H16zM18 23h1v1H18zM20 23h6v1H20zM28,23 h5v1H28zM0 24h1v1H0zM2 24h5v1H2zM8 24h2v1H8zM11 24h1v1H11zM14 24h1v1H14zM16 24h2v1H16zM19 24h2v1H19zM22 24h7v1H22zM30 24h2v1H30zM8 25h1v1H8zM12 25h1v1H12zM16 25h3v1H16zM20 25h1v1H20zM23 25h2v1H23zM28 25h1v1H28zM30 25h1v1H30zM32,25 h1v1H32zM0 26h7v1H0zM12 26h6v1H12zM22 26h3v1H22zM26 26h1v1H26zM28 26h2v1H28zM31 26h1v1H31zM0 27h1v1H0zM6 27h1v1H6zM8 27h2v1H8zM11 27h2v1H11zM17 27h5v1H17zM24 27h1v1H24zM28 27h4v1H28zM0 28h1v1H0zM2 28h3v1H2zM6 28h1v1H6zM8 28h1v1H8zM10 28h1v1H10zM14 28h1v1H14zM16 28h1v1H16zM20 28h1v1H20zM22 28h1v1H22zM24 28h5v1H24zM32,28 h1v1H32zM0 29h1v1H0zM2 29h3v1H2zM6 29h1v1H6zM8 29h1v1H8zM10 29h1v1H10zM13 29h1v1H13zM15 29h1v1H15zM18 29h2v1H18zM22 29h4v1H22zM27,29 h6v1H27zM0 30h1v1H0zM2 30h3v1H2zM6 30h1v1H6zM8 30h1v1H8zM10 30h1v1H10zM13 30h6v1H13zM21 30h3v1H21zM29 30h1v1H29zM0 31h1v1H0zM6 31h1v1H6zM11 31h1v1H11zM13 31h3v1H13zM18 31h1v1H18zM20 31h7v1H20zM28 31h3v1H28zM0 32h7v1H0zM8 32h1v1H8zM11 32h2v1H11zM15 32h1v1H15zM21 32h5v1H21zM28 32h1v1H28zM30 32h2v1H30z" shape-rendering="crispEdges"></path></svg>'
            );
        });

        it('should display QRCode containing `serializedPaymentInformation`', () => {
            expect(screen.getByText(bitcoinURI));
        });
    });
});
