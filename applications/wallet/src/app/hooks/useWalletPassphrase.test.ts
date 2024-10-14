import { renderHook } from '@testing-library/react';

import type { IWasmApiWalletData, WalletWithChainData } from '@proton/wallet';

import { mockUseBitcoinBlockchainContext } from '../tests';
import { useWalletPassphrase } from './useWalletPassphrase';

describe('useWalletPassphrase', () => {
    const walletID = '-1';
    beforeEach(() => {
        mockUseBitcoinBlockchainContext({
            walletsChainData: { [walletID]: { wallet: { getFingerprint: vi.fn() } } as unknown as WalletWithChainData },
        });
    });

    it('should require passphrase when needed', () => {
        const { result } = renderHook(() =>
            useWalletPassphrase({ Wallet: { ID: walletID, HasPassphrase: 1 } } as IWasmApiWalletData)
        );

        expect(result.current.needPassphrase).toBeTruthy();
        expect(result.current.canUseWallet).toBeFalsy();
    });

    describe('fingerprint', () => {
        beforeEach(() => {
            mockUseBitcoinBlockchainContext({
                walletsChainData: {
                    [walletID]: {
                        wallet: { getFingerprint: vi.fn().mockReturnValue('abcdefgh') },
                    } as unknown as WalletWithChainData,
                },
            });
        });

        it('should inform when fingerprint is not correct', () => {
            const { result } = renderHook(() =>
                useWalletPassphrase({
                    Wallet: { ID: walletID, HasPassphrase: 1, Passphrase: 'xyz', Fingerprint: 'abcdfghi' },
                } as IWasmApiWalletData)
            );

            expect(result.current.wrongFingerprint).toBeTruthy();
            expect(result.current.canUseWallet).toBeFalsy();
        });

        it('should inform when wallet is usable', () => {
            const { result } = renderHook(() =>
                useWalletPassphrase({
                    Wallet: { ID: walletID, HasPassphrase: 1, Passphrase: 'xyz', Fingerprint: 'abcdefgh' },
                } as IWasmApiWalletData)
            );

            expect(result.current.needPassphrase).toBeFalsy();
            expect(result.current.wrongFingerprint).toBeFalsy();
            expect(result.current.canUseWallet).toBeTruthy();
        });
    });
});
