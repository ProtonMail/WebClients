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
} from '@proton/wallet';

import { WalletReceiveContent } from '.';
import { mockUseBitcoinBlockchainContext } from '../../../tests';

vi.mock('../WalletReceiveExtraContent', () => ({
    WalletReceiveExtraContent: () => <></>,
}));

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
                    hasReachedStopGap: false,
                    willReachStopGap: false,
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

            const buttonGenNew = screen.getByTestId('generate-new-address-button');
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
                        hasReachedStopGap: false,
                        willReachStopGap: false,
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

            const buttonGenNew = screen.getByTestId('generate-new-address-button');
            expect(buttonGenNew).toBeDisabled();
        });
    });

    describe('when gap is soon reached', () => {
        beforeEach(() => {
            mockUseBitcoinBlockchainContext({
                bitcoinAddressHelperByWalletAccountId: {
                    [testAccount.ID]: {
                        generateNewReceiveAddress: mockGenerateNewReceiveAddress,
                        hasReachedStopGap: false,
                        willReachStopGap: true,
                        isLoading: false,
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

        const bitcoinURI = WasmPaymentLink.tryParse(
            'bitcoin:tb1qddqzdcxs9fp0xdd9nfycar58nfcq9s0xpsqf9h',
            WasmNetwork.Testnet
        );

        it('should display QRCode containing serialized payment info', () => {
            const qrcode = screen.getByTestId('serialized-payment-info-qrcode');
            expect(qrcode.outerHTML).toBe(
                '<svg height="200" width="200" viewBox="0 0 29 29" role="img" class="qr-code" data-testid="serialized-payment-info-qrcode"><path fill="#FFFFFF" d="M0,0 h29v29H0z" shape-rendering="crispEdges"></path><path fill="#000000" d="M0 0h7v1H0zM12 0h2v1H12zM16 0h1v1H16zM19 0h2v1H19zM22,0 h7v1H22zM0 1h1v1H0zM6 1h1v1H6zM8 1h1v1H8zM10 1h1v1H10zM12 1h4v1H12zM18 1h1v1H18zM22 1h1v1H22zM28,1 h1v1H28zM0 2h1v1H0zM2 2h3v1H2zM6 2h1v1H6zM12 2h1v1H12zM15 2h1v1H15zM18 2h3v1H18zM22 2h1v1H22zM24 2h3v1H24zM28,2 h1v1H28zM0 3h1v1H0zM2 3h3v1H2zM6 3h1v1H6zM8 3h7v1H8zM16 3h3v1H16zM22 3h1v1H22zM24 3h3v1H24zM28,3 h1v1H28zM0 4h1v1H0zM2 4h3v1H2zM6 4h1v1H6zM9 4h1v1H9zM11 4h1v1H11zM19 4h2v1H19zM22 4h1v1H22zM24 4h3v1H24zM28,4 h1v1H28zM0 5h1v1H0zM6 5h1v1H6zM8 5h2v1H8zM13 5h4v1H13zM18 5h1v1H18zM20 5h1v1H20zM22 5h1v1H22zM28,5 h1v1H28zM0 6h7v1H0zM8 6h1v1H8zM10 6h1v1H10zM12 6h1v1H12zM14 6h1v1H14zM16 6h1v1H16zM18 6h1v1H18zM20 6h1v1H20zM22,6 h7v1H22zM9 7h2v1H9zM12 7h1v1H12zM15 7h2v1H15zM18 7h1v1H18zM0 8h5v1H0zM6 8h4v1H6zM11 8h1v1H11zM13 8h5v1H13zM19 8h3v1H19zM23 8h1v1H23zM25 8h1v1H25zM27 8h1v1H27zM0 9h4v1H0zM5 9h1v1H5zM10 9h3v1H10zM17 9h1v1H17zM19 9h1v1H19zM21 9h4v1H21zM27,9 h2v1H27zM0 10h1v1H0zM3 10h1v1H3zM6 10h1v1H6zM8 10h1v1H8zM10 10h1v1H10zM12 10h2v1H12zM15 10h1v1H15zM18 10h1v1H18zM20 10h1v1H20zM23 10h4v1H23zM0 11h1v1H0zM2 11h1v1H2zM4 11h2v1H4zM8 11h1v1H8zM11 11h1v1H11zM14 11h1v1H14zM18 11h2v1H18zM21 11h1v1H21zM24 11h2v1H24zM27 11h1v1H27zM0 12h1v1H0zM2 12h1v1H2zM5 12h3v1H5zM9 12h2v1H9zM12 12h6v1H12zM20 12h1v1H20zM23 12h1v1H23zM26 12h1v1H26zM0 13h1v1H0zM2 13h4v1H2zM7 13h1v1H7zM11 13h1v1H11zM14 13h1v1H14zM16 13h1v1H16zM18 13h9v1H18zM28,13 h1v1H28zM0 14h1v1H0zM2 14h1v1H2zM5 14h2v1H5zM10 14h1v1H10zM15 14h2v1H15zM23 14h4v1H23zM0 15h1v1H0zM5 15h1v1H5zM7 15h2v1H7zM10 15h1v1H10zM12 15h1v1H12zM14 15h2v1H14zM18 15h1v1H18zM21 15h1v1H21zM24 15h2v1H24zM2 16h1v1H2zM4 16h1v1H4zM6 16h1v1H6zM8 16h1v1H8zM13 16h1v1H13zM15 16h1v1H15zM17 16h1v1H17zM19 16h2v1H19zM23 16h1v1H23zM26,16 h3v1H26zM0 17h1v1H0zM2 17h1v1H2zM4 17h2v1H4zM11 17h1v1H11zM13 17h2v1H13zM16 17h1v1H16zM18 17h3v1H18zM22 17h1v1H22zM24 17h1v1H24zM26,17 h3v1H26zM0 18h1v1H0zM3 18h6v1H3zM15 18h2v1H15zM20 18h2v1H20zM25 18h1v1H25zM0 19h1v1H0zM3 19h1v1H3zM8 19h1v1H8zM11 19h2v1H11zM14 19h1v1H14zM18 19h2v1H18zM24 19h2v1H24zM27,19 h2v1H27zM0 20h1v1H0zM5 20h6v1H5zM13 20h3v1H13zM17 20h2v1H17zM20 20h5v1H20zM26 20h2v1H26zM8 21h1v1H8zM11 21h1v1H11zM14 21h1v1H14zM16 21h2v1H16zM20 21h1v1H20zM24,21 h5v1H24zM0 22h7v1H0zM8 22h1v1H8zM10 22h1v1H10zM12 22h2v1H12zM15 22h2v1H15zM18 22h3v1H18zM22 22h1v1H22zM24 22h1v1H24zM26 22h1v1H26zM0 23h1v1H0zM6 23h1v1H6zM9 23h1v1H9zM12 23h1v1H12zM14 23h2v1H14zM19 23h2v1H19zM24 23h1v1H24zM27,23 h2v1H27zM0 24h1v1H0zM2 24h3v1H2zM6 24h1v1H6zM8 24h2v1H8zM13 24h1v1H13zM16 24h2v1H16zM20 24h8v1H20zM0 25h1v1H0zM2 25h3v1H2zM6 25h1v1H6zM8 25h1v1H8zM11 25h1v1H11zM14 25h1v1H14zM16 25h3v1H16zM26 25h1v1H26zM28,25 h1v1H28zM0 26h1v1H0zM2 26h3v1H2zM6 26h1v1H6zM8 26h1v1H8zM12 26h1v1H12zM15 26h1v1H15zM17 26h1v1H17zM19 26h1v1H19zM22 26h3v1H22zM26 26h2v1H26zM0 27h1v1H0zM6 27h1v1H6zM8 27h1v1H8zM10 27h1v1H10zM12 27h1v1H12zM16 27h1v1H16zM18 27h1v1H18zM20 27h3v1H20zM24 27h2v1H24zM27 27h1v1H27zM0 28h7v1H0zM8 28h2v1H8zM11 28h1v1H11zM13 28h3v1H13zM17 28h1v1H17zM19 28h1v1H19zM21 28h6v1H21z" shape-rendering="crispEdges"></path></svg>'
            );
        });

        it('should display QRCode containing `paymentLink`', () => {
            expect(screen.getByText(`Bitcoin address #0`));
            expect(screen.getByText(`${bitcoinURI.toString()}`));
        });

        it('should enable actions', () => {
            const copyButton = screen.getByText(copyAddressButtonText);
            expect(copyButton).toBeEnabled();

            const buttonGenNew = screen.getByTestId('generate-new-address-button');
            expect(buttonGenNew).toBeEnabled();

            const buttonGenNewWarning = screen.getByTestId('generate-new-address-button-warning');
            expect(buttonGenNew).toContainElement(buttonGenNewWarning);
        });
    });

    describe('when gap is reached', () => {
        beforeEach(() => {
            mockUseBitcoinBlockchainContext({
                bitcoinAddressHelperByWalletAccountId: {
                    [testAccount.ID]: {
                        generateNewReceiveAddress: mockGenerateNewReceiveAddress,
                        hasReachedStopGap: true,
                        willReachStopGap: true,
                        isLoading: false,
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

        const bitcoinURI = WasmPaymentLink.tryParse(
            'bitcoin:tb1qddqzdcxs9fp0xdd9nfycar58nfcq9s0xpsqf9h',
            WasmNetwork.Testnet
        );

        it('should display QRCode containing serialized payment info', () => {
            const qrcode = screen.getByTestId('serialized-payment-info-qrcode');
            expect(qrcode.outerHTML).toBe(
                '<svg height="200" width="200" viewBox="0 0 29 29" role="img" class="qr-code" data-testid="serialized-payment-info-qrcode"><path fill="#FFFFFF" d="M0,0 h29v29H0z" shape-rendering="crispEdges"></path><path fill="#000000" d="M0 0h7v1H0zM12 0h2v1H12zM16 0h1v1H16zM19 0h2v1H19zM22,0 h7v1H22zM0 1h1v1H0zM6 1h1v1H6zM8 1h1v1H8zM10 1h1v1H10zM12 1h4v1H12zM18 1h1v1H18zM22 1h1v1H22zM28,1 h1v1H28zM0 2h1v1H0zM2 2h3v1H2zM6 2h1v1H6zM12 2h1v1H12zM15 2h1v1H15zM18 2h3v1H18zM22 2h1v1H22zM24 2h3v1H24zM28,2 h1v1H28zM0 3h1v1H0zM2 3h3v1H2zM6 3h1v1H6zM8 3h7v1H8zM16 3h3v1H16zM22 3h1v1H22zM24 3h3v1H24zM28,3 h1v1H28zM0 4h1v1H0zM2 4h3v1H2zM6 4h1v1H6zM9 4h1v1H9zM11 4h1v1H11zM19 4h2v1H19zM22 4h1v1H22zM24 4h3v1H24zM28,4 h1v1H28zM0 5h1v1H0zM6 5h1v1H6zM8 5h2v1H8zM13 5h4v1H13zM18 5h1v1H18zM20 5h1v1H20zM22 5h1v1H22zM28,5 h1v1H28zM0 6h7v1H0zM8 6h1v1H8zM10 6h1v1H10zM12 6h1v1H12zM14 6h1v1H14zM16 6h1v1H16zM18 6h1v1H18zM20 6h1v1H20zM22,6 h7v1H22zM9 7h2v1H9zM12 7h1v1H12zM15 7h2v1H15zM18 7h1v1H18zM0 8h5v1H0zM6 8h4v1H6zM11 8h1v1H11zM13 8h5v1H13zM19 8h3v1H19zM23 8h1v1H23zM25 8h1v1H25zM27 8h1v1H27zM0 9h4v1H0zM5 9h1v1H5zM10 9h3v1H10zM17 9h1v1H17zM19 9h1v1H19zM21 9h4v1H21zM27,9 h2v1H27zM0 10h1v1H0zM3 10h1v1H3zM6 10h1v1H6zM8 10h1v1H8zM10 10h1v1H10zM12 10h2v1H12zM15 10h1v1H15zM18 10h1v1H18zM20 10h1v1H20zM23 10h4v1H23zM0 11h1v1H0zM2 11h1v1H2zM4 11h2v1H4zM8 11h1v1H8zM11 11h1v1H11zM14 11h1v1H14zM18 11h2v1H18zM21 11h1v1H21zM24 11h2v1H24zM27 11h1v1H27zM0 12h1v1H0zM2 12h1v1H2zM5 12h3v1H5zM9 12h2v1H9zM12 12h6v1H12zM20 12h1v1H20zM23 12h1v1H23zM26 12h1v1H26zM0 13h1v1H0zM2 13h4v1H2zM7 13h1v1H7zM11 13h1v1H11zM14 13h1v1H14zM16 13h1v1H16zM18 13h9v1H18zM28,13 h1v1H28zM0 14h1v1H0zM2 14h1v1H2zM5 14h2v1H5zM10 14h1v1H10zM15 14h2v1H15zM23 14h4v1H23zM0 15h1v1H0zM5 15h1v1H5zM7 15h2v1H7zM10 15h1v1H10zM12 15h1v1H12zM14 15h2v1H14zM18 15h1v1H18zM21 15h1v1H21zM24 15h2v1H24zM2 16h1v1H2zM4 16h1v1H4zM6 16h1v1H6zM8 16h1v1H8zM13 16h1v1H13zM15 16h1v1H15zM17 16h1v1H17zM19 16h2v1H19zM23 16h1v1H23zM26,16 h3v1H26zM0 17h1v1H0zM2 17h1v1H2zM4 17h2v1H4zM11 17h1v1H11zM13 17h2v1H13zM16 17h1v1H16zM18 17h3v1H18zM22 17h1v1H22zM24 17h1v1H24zM26,17 h3v1H26zM0 18h1v1H0zM3 18h6v1H3zM15 18h2v1H15zM20 18h2v1H20zM25 18h1v1H25zM0 19h1v1H0zM3 19h1v1H3zM8 19h1v1H8zM11 19h2v1H11zM14 19h1v1H14zM18 19h2v1H18zM24 19h2v1H24zM27,19 h2v1H27zM0 20h1v1H0zM5 20h6v1H5zM13 20h3v1H13zM17 20h2v1H17zM20 20h5v1H20zM26 20h2v1H26zM8 21h1v1H8zM11 21h1v1H11zM14 21h1v1H14zM16 21h2v1H16zM20 21h1v1H20zM24,21 h5v1H24zM0 22h7v1H0zM8 22h1v1H8zM10 22h1v1H10zM12 22h2v1H12zM15 22h2v1H15zM18 22h3v1H18zM22 22h1v1H22zM24 22h1v1H24zM26 22h1v1H26zM0 23h1v1H0zM6 23h1v1H6zM9 23h1v1H9zM12 23h1v1H12zM14 23h2v1H14zM19 23h2v1H19zM24 23h1v1H24zM27,23 h2v1H27zM0 24h1v1H0zM2 24h3v1H2zM6 24h1v1H6zM8 24h2v1H8zM13 24h1v1H13zM16 24h2v1H16zM20 24h8v1H20zM0 25h1v1H0zM2 25h3v1H2zM6 25h1v1H6zM8 25h1v1H8zM11 25h1v1H11zM14 25h1v1H14zM16 25h3v1H16zM26 25h1v1H26zM28,25 h1v1H28zM0 26h1v1H0zM2 26h3v1H2zM6 26h1v1H6zM8 26h1v1H8zM12 26h1v1H12zM15 26h1v1H15zM17 26h1v1H17zM19 26h1v1H19zM22 26h3v1H22zM26 26h2v1H26zM0 27h1v1H0zM6 27h1v1H6zM8 27h1v1H8zM10 27h1v1H10zM12 27h1v1H12zM16 27h1v1H16zM18 27h1v1H18zM20 27h3v1H20zM24 27h2v1H24zM27 27h1v1H27zM0 28h7v1H0zM8 28h2v1H8zM11 28h1v1H11zM13 28h3v1H13zM17 28h1v1H17zM19 28h1v1H19zM21 28h6v1H21z" shape-rendering="crispEdges"></path></svg>'
            );
        });

        it('should display QRCode containing `paymentLink`', () => {
            expect(screen.getByText(`Bitcoin address #0`));
            expect(screen.getByText(`${bitcoinURI.toString()}`));
        });

        it('should disable actions', () => {
            const copyButton = screen.getByText(copyAddressButtonText);
            expect(copyButton).toBeEnabled();

            const buttonGenNew = screen.getByTestId('generate-new-address-button');
            expect(buttonGenNew).toBeDisabled();

            const buttonGenNewError = screen.getByTestId('generate-new-address-button-error');
            expect(buttonGenNew).toContainElement(buttonGenNewError);
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
                '<svg height="200" width="200" viewBox="0 0 29 29" role="img" class="qr-code" data-testid="serialized-payment-info-qrcode"><path fill="#FFFFFF" d="M0,0 h29v29H0z" shape-rendering="crispEdges"></path><path fill="#000000" d="M0 0h7v1H0zM12 0h2v1H12zM16 0h1v1H16zM19 0h2v1H19zM22,0 h7v1H22zM0 1h1v1H0zM6 1h1v1H6zM8 1h1v1H8zM10 1h1v1H10zM12 1h4v1H12zM18 1h1v1H18zM22 1h1v1H22zM28,1 h1v1H28zM0 2h1v1H0zM2 2h3v1H2zM6 2h1v1H6zM12 2h1v1H12zM15 2h1v1H15zM18 2h3v1H18zM22 2h1v1H22zM24 2h3v1H24zM28,2 h1v1H28zM0 3h1v1H0zM2 3h3v1H2zM6 3h1v1H6zM8 3h7v1H8zM16 3h3v1H16zM22 3h1v1H22zM24 3h3v1H24zM28,3 h1v1H28zM0 4h1v1H0zM2 4h3v1H2zM6 4h1v1H6zM9 4h1v1H9zM11 4h1v1H11zM19 4h2v1H19zM22 4h1v1H22zM24 4h3v1H24zM28,4 h1v1H28zM0 5h1v1H0zM6 5h1v1H6zM8 5h2v1H8zM13 5h4v1H13zM18 5h1v1H18zM20 5h1v1H20zM22 5h1v1H22zM28,5 h1v1H28zM0 6h7v1H0zM8 6h1v1H8zM10 6h1v1H10zM12 6h1v1H12zM14 6h1v1H14zM16 6h1v1H16zM18 6h1v1H18zM20 6h1v1H20zM22,6 h7v1H22zM9 7h2v1H9zM12 7h1v1H12zM15 7h2v1H15zM18 7h1v1H18zM0 8h5v1H0zM6 8h4v1H6zM11 8h1v1H11zM13 8h5v1H13zM19 8h3v1H19zM23 8h1v1H23zM25 8h1v1H25zM27 8h1v1H27zM0 9h4v1H0zM5 9h1v1H5zM10 9h3v1H10zM17 9h1v1H17zM19 9h1v1H19zM21 9h4v1H21zM27,9 h2v1H27zM0 10h1v1H0zM3 10h1v1H3zM6 10h1v1H6zM8 10h1v1H8zM10 10h1v1H10zM12 10h2v1H12zM15 10h1v1H15zM18 10h1v1H18zM20 10h1v1H20zM23 10h4v1H23zM0 11h1v1H0zM2 11h1v1H2zM4 11h2v1H4zM8 11h1v1H8zM11 11h1v1H11zM14 11h1v1H14zM18 11h2v1H18zM21 11h1v1H21zM24 11h2v1H24zM27 11h1v1H27zM0 12h1v1H0zM2 12h1v1H2zM5 12h3v1H5zM9 12h2v1H9zM12 12h6v1H12zM20 12h1v1H20zM23 12h1v1H23zM26 12h1v1H26zM0 13h1v1H0zM2 13h4v1H2zM7 13h1v1H7zM11 13h1v1H11zM14 13h1v1H14zM16 13h1v1H16zM18 13h9v1H18zM28,13 h1v1H28zM0 14h1v1H0zM2 14h1v1H2zM5 14h2v1H5zM10 14h1v1H10zM15 14h2v1H15zM23 14h4v1H23zM0 15h1v1H0zM5 15h1v1H5zM7 15h2v1H7zM10 15h1v1H10zM12 15h1v1H12zM14 15h2v1H14zM18 15h1v1H18zM21 15h1v1H21zM24 15h2v1H24zM2 16h1v1H2zM4 16h1v1H4zM6 16h1v1H6zM8 16h1v1H8zM13 16h1v1H13zM15 16h1v1H15zM17 16h1v1H17zM19 16h2v1H19zM23 16h1v1H23zM26,16 h3v1H26zM0 17h1v1H0zM2 17h1v1H2zM4 17h2v1H4zM11 17h1v1H11zM13 17h2v1H13zM16 17h1v1H16zM18 17h3v1H18zM22 17h1v1H22zM24 17h1v1H24zM26,17 h3v1H26zM0 18h1v1H0zM3 18h6v1H3zM15 18h2v1H15zM20 18h2v1H20zM25 18h1v1H25zM0 19h1v1H0zM3 19h1v1H3zM8 19h1v1H8zM11 19h2v1H11zM14 19h1v1H14zM18 19h2v1H18zM24 19h2v1H24zM27,19 h2v1H27zM0 20h1v1H0zM5 20h6v1H5zM13 20h3v1H13zM17 20h2v1H17zM20 20h5v1H20zM26 20h2v1H26zM8 21h1v1H8zM11 21h1v1H11zM14 21h1v1H14zM16 21h2v1H16zM20 21h1v1H20zM24,21 h5v1H24zM0 22h7v1H0zM8 22h1v1H8zM10 22h1v1H10zM12 22h2v1H12zM15 22h2v1H15zM18 22h3v1H18zM22 22h1v1H22zM24 22h1v1H24zM26 22h1v1H26zM0 23h1v1H0zM6 23h1v1H6zM9 23h1v1H9zM12 23h1v1H12zM14 23h2v1H14zM19 23h2v1H19zM24 23h1v1H24zM27,23 h2v1H27zM0 24h1v1H0zM2 24h3v1H2zM6 24h1v1H6zM8 24h2v1H8zM13 24h1v1H13zM16 24h2v1H16zM20 24h8v1H20zM0 25h1v1H0zM2 25h3v1H2zM6 25h1v1H6zM8 25h1v1H8zM11 25h1v1H11zM14 25h1v1H14zM16 25h3v1H16zM26 25h1v1H26zM28,25 h1v1H28zM0 26h1v1H0zM2 26h3v1H2zM6 26h1v1H6zM8 26h1v1H8zM12 26h1v1H12zM15 26h1v1H15zM17 26h1v1H17zM19 26h1v1H19zM22 26h3v1H22zM26 26h2v1H26zM0 27h1v1H0zM6 27h1v1H6zM8 27h1v1H8zM10 27h1v1H10zM12 27h1v1H12zM16 27h1v1H16zM18 27h1v1H18zM20 27h3v1H20zM24 27h2v1H24zM27 27h1v1H27zM0 28h7v1H0zM8 28h2v1H8zM11 28h1v1H11zM13 28h3v1H13zM17 28h1v1H17zM19 28h1v1H19zM21 28h6v1H21z" shape-rendering="crispEdges"></path></svg>'
            );
        });

        it('should display QRCode containing `paymentLink`', () => {
            expect(screen.getByText(`Bitcoin address #0`));
            expect(screen.getByText(`${bitcoinURI.toString()}`));
        });
    });
});
