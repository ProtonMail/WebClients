import { render, screen } from '@testing-library/react';

import { WasmKeychainKind, WasmNetwork, WasmPaymentLink } from '@proton/andromeda';
import { mockUseNotifications } from '@proton/testing/lib/vitest';
import {
    apiWalletsData,
    freeable,
    mockUseFiatCurrencies,
    mockUseGetExchangeRate,
    mockUseUserWalletSettings,
    mockUseWalletAccountExchangeRate,
} from '@proton/wallet/tests';

import { WalletReceiveContent } from '.';
import { mockUseBitcoinBlockchainContext } from '../../../tests';

describe('WalletReceiveContent', () => {
    const [testWallet] = apiWalletsData;
    const [testAccount] = testWallet.WalletAccounts;

    const copyAddressButtonText = 'Copy Bitcoin address';

    const mockGenerateNewReceiveAddress = vi.fn();

    beforeEach(() => {
        mockUseBitcoinBlockchainContext({
            bitcoinAddressHelperByWalletAccountId: {
                [testAccount.ID]: {
                    generateNewReceiveAddress: mockGenerateNewReceiveAddress,
                    isLoading: false,
                    receiveBitcoinAddress: freeable({
                        keychain: WasmKeychainKind.External,
                        address: 'tb1qddqzdcxs9fp0xdd9nfycar58nfcq9s0xpsqf9h',
                        index: 0,
                    }),
                },
            },
        });

        mockUseWalletAccountExchangeRate(null);
        mockUseGetExchangeRate();
        mockUseFiatCurrencies();
        mockUseUserWalletSettings();
        mockUseNotifications();
    });

    describe('when address is not generated yet', () => {
        beforeEach(() => {
            mockUseBitcoinBlockchainContext({
                bitcoinAddressHelperByWalletAccountId: {
                    [testAccount.ID]: undefined,
                },
            });

            render(<WalletReceiveContent wallet={testWallet} account={testAccount} />);
        });

        it('should display a loader', () => {
            expect(screen.getByText('Loading')).toBeInTheDocument();
            expect(screen.getByText('Address generation in progress')).toBeInTheDocument();
        });

        it('should disable actions', () => {
            const copyButton = screen.getByText(copyAddressButtonText);
            expect(copyButton).toBeDisabled();

            const buttonGenNew = screen.getByText('Generate new address');
            expect(buttonGenNew).toBeDisabled();
        });

        it('should not display amount button', async () => {
            expect(screen.queryByTestId('show-amount-input-button')).toBeNull();
        });
    });

    describe('when address is loading', () => {
        beforeEach(() => {
            mockUseBitcoinBlockchainContext({
                bitcoinAddressHelperByWalletAccountId: {
                    [testAccount.ID]: {
                        generateNewReceiveAddress: mockGenerateNewReceiveAddress,
                        isLoading: true,
                        receiveBitcoinAddress: freeable({
                            keychain: WasmKeychainKind.External,
                            address: 'tb1qddqzdcxs9fp0xdd9nfycar58nfcq9s0xpsqf9h',
                            index: 0,
                        }),
                    },
                },
            });

            render(<WalletReceiveContent wallet={testWallet} account={testAccount} />);
        });

        it('should display a loader', () => {
            expect(screen.getByText('Loading')).toBeInTheDocument();
            expect(screen.getByText('Address generation in progress')).toBeInTheDocument();
        });

        it('should disable actions', () => {
            const copyButton = screen.getByText(copyAddressButtonText);
            expect(copyButton).toBeDisabled();

            const buttonGenNew = screen.getByText('Generate new address');
            expect(buttonGenNew).toBeDisabled();
        });
    });

    describe('payment info display', () => {
        const bitcoinURI = WasmPaymentLink.tryParse(
            'bitcoin:tb1qddqzdcxs9fp0xdd9nfycar58nfcq9s0xpsqf9h',
            WasmNetwork.Testnet
        );

        beforeEach(() => {
            render(<WalletReceiveContent wallet={testWallet} account={testAccount} />);
        });

        it('should display QRCode containing serialized payment info', () => {
            const qrcode = screen.getByTestId('serialized-payment-info-qrcode');
            expect(qrcode.outerHTML).toBe(
                '<svg height="200" width="200" viewBox="0 0 29 29" class="qr-code" data-testid="serialized-payment-info-qrcode"><path fill="#FFFFFF" d="M0,0 h29v29H0z" shape-rendering="crispEdges"></path><path fill="#000000" d="M0 0h7v1H0zM9 0h1v1H9zM11 0h2v1H11zM14 0h1v1H14zM16 0h2v1H16zM19 0h2v1H19zM22,0 h7v1H22zM0 1h1v1H0zM6 1h1v1H6zM9 1h1v1H9zM15 1h1v1H15zM18 1h1v1H18zM22 1h1v1H22zM28,1 h1v1H28zM0 2h1v1H0zM2 2h3v1H2zM6 2h1v1H6zM8 2h2v1H8zM12 2h1v1H12zM15 2h1v1H15zM19 2h2v1H19zM22 2h1v1H22zM24 2h3v1H24zM28,2 h1v1H28zM0 3h1v1H0zM2 3h3v1H2zM6 3h1v1H6zM8 3h2v1H8zM13 3h2v1H13zM16 3h2v1H16zM22 3h1v1H22zM24 3h3v1H24zM28,3 h1v1H28zM0 4h1v1H0zM2 4h3v1H2zM6 4h1v1H6zM8 4h3v1H8zM12 4h1v1H12zM14 4h1v1H14zM16 4h1v1H16zM18 4h3v1H18zM22 4h1v1H22zM24 4h3v1H24zM28,4 h1v1H28zM0 5h1v1H0zM6 5h1v1H6zM8 5h1v1H8zM11 5h1v1H11zM13 5h1v1H13zM15 5h1v1H15zM17 5h2v1H17zM22 5h1v1H22zM28,5 h1v1H28zM0 6h7v1H0zM8 6h1v1H8zM10 6h1v1H10zM12 6h1v1H12zM14 6h1v1H14zM16 6h1v1H16zM18 6h1v1H18zM20 6h1v1H20zM22,6 h7v1H22zM8 7h1v1H8zM10 7h1v1H10zM12 7h1v1H12zM14 7h2v1H14zM19 7h2v1H19zM0 8h1v1H0zM2 8h5v1H2zM10 8h2v1H10zM13 8h5v1H13zM19 8h1v1H19zM22 8h5v1H22zM5 9h1v1H5zM7 9h1v1H7zM10 9h3v1H10zM14 9h1v1H14zM18 9h3v1H18zM22 9h1v1H22zM24 9h1v1H24zM28,9 h1v1H28zM1 10h2v1H1zM5 10h2v1H5zM9 10h1v1H9zM12 10h1v1H12zM15 10h2v1H15zM18 10h1v1H18zM20 10h4v1H20zM25 10h1v1H25zM0 11h2v1H0zM5 11h1v1H5zM8 11h1v1H8zM10 11h3v1H10zM14 11h1v1H14zM24 11h2v1H24zM0 12h8v1H0zM11 12h1v1H11zM13 12h5v1H13zM19 12h2v1H19zM23 12h1v1H23zM26 12h2v1H26zM2 13h2v1H2zM16 13h1v1H16zM19 13h1v1H19zM21 13h5v1H21zM28,13 h1v1H28zM0 14h1v1H0zM6 14h3v1H6zM11 14h1v1H11zM13 14h6v1H13zM24 14h1v1H24zM27 14h1v1H27zM0 15h1v1H0zM3 15h1v1H3zM15 15h1v1H15zM18 15h1v1H18zM20 15h3v1H20zM25 15h1v1H25zM27,15 h2v1H27zM0 16h3v1H0zM5 16h2v1H5zM8 16h1v1H8zM11 16h3v1H11zM16 16h3v1H16zM23 16h1v1H23zM26 16h2v1H26zM0 17h1v1H0zM5 17h1v1H5zM9 17h2v1H9zM13 17h2v1H13zM19 17h2v1H19zM22 17h4v1H22zM27,17 h2v1H27zM0 18h1v1H0zM2 18h1v1H2zM4 18h1v1H4zM6 18h2v1H6zM11 18h1v1H11zM15 18h2v1H15zM21 18h1v1H21zM23 18h1v1H23zM0 19h1v1H0zM4 19h1v1H4zM8 19h1v1H8zM14 19h2v1H14zM20 19h2v1H20zM24 19h2v1H24zM27 19h1v1H27zM0 20h1v1H0zM3 20h4v1H3zM8 20h1v1H8zM10 20h9v1H10zM20 20h7v1H20zM8 21h1v1H8zM11 21h3v1H11zM16 21h2v1H16zM20 21h1v1H20zM24 21h1v1H24zM28,21 h1v1H28zM0 22h7v1H0zM10 22h2v1H10zM15 22h2v1H15zM18 22h3v1H18zM22 22h1v1H22zM24 22h2v1H24zM0 23h1v1H0zM6 23h1v1H6zM8 23h2v1H8zM11 23h1v1H11zM18 23h3v1H18zM24 23h2v1H24zM27,23 h2v1H27zM0 24h1v1H0zM2 24h3v1H2zM6 24h1v1H6zM8 24h2v1H8zM12 24h1v1H12zM15 24h1v1H15zM17 24h1v1H17zM20,24 h9v1H20zM0 25h1v1H0zM2 25h3v1H2zM6 25h1v1H6zM8 25h1v1H8zM10 25h1v1H10zM13 25h1v1H13zM16 25h3v1H16zM21 25h1v1H21zM26,25 h3v1H26zM0 26h1v1H0zM2 26h3v1H2zM6 26h1v1H6zM8 26h1v1H8zM12 26h4v1H12zM17 26h1v1H17zM20 26h1v1H20zM22 26h3v1H22zM26 26h2v1H26zM0 27h1v1H0zM6 27h1v1H6zM9 27h2v1H9zM13 27h1v1H13zM16 27h1v1H16zM18 27h4v1H18zM24 27h2v1H24zM27 27h1v1H27zM0 28h7v1H0zM8 28h2v1H8zM14 28h2v1H14zM17 28h1v1H17zM19 28h1v1H19zM21 28h1v1H21zM23 28h2v1H23zM26 28h1v1H26z" shape-rendering="crispEdges"></path></svg>'
            );
        });

        it('should display QRCode containing `paymentLink`', () => {
            expect(screen.getByText(bitcoinURI.toString()));
        });
    });
});
