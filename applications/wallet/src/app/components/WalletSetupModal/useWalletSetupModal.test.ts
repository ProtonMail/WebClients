import { act, renderHook } from '@testing-library/react-hooks';
import { vi } from 'vitest';

import { mockUseNotifications, mockUseUser, mockUseUserKey } from '@proton/testing/lib/vitest';

import { mockUseBitcoinBlockchainContext, mockUseWalletDispatch } from '../../tests/mocks';
import { mockUseDecryptedWallets } from '../../tests/mocks/useDecryptedWallet';
import { WalletSetupMode, WalletSetupStep } from './type';
import { useWalletSetupModal } from './useWalletSetupModal';

describe('useWalletSetupModal', () => {
    beforeEach(() => {
        mockUseNotifications();
        mockUseUser();
        mockUseUserKey();
        mockUseWalletDispatch();
        mockUseDecryptedWallets();
        mockUseBitcoinBlockchainContext();
    });

    describe('onSelectSetupMode', () => {
        describe('when Creation is selected', () => {
            it("should set mode and move to mod's first step", () => {
                const { result } = renderHook(() => useWalletSetupModal({ isOpen: true, onSetupFinish: vi.fn() }));

                act(() => {
                    result.current.onSelectSetupMode(WalletSetupMode.Creation);
                });

                expect(result.current.setupMode).toBe(WalletSetupMode.Creation);
                expect(result.current.currentStep).toBe(WalletSetupStep.MnemonicGeneration);
            });
        });

        describe('when Import is selected', () => {
            it("should set mode and move to mod's first step", () => {
                const { result } = renderHook(() => useWalletSetupModal({ isOpen: true, onSetupFinish: vi.fn() }));

                act(() => {
                    result.current.onSelectSetupMode(WalletSetupMode.Import);
                });

                expect(result.current.setupMode).toBe(WalletSetupMode.Import);
                expect(result.current.currentStep).toBe(WalletSetupStep.MnemonicInput);
            });
        });
    });

    describe('onNextStep', () => {
        describe('Import', () => {
            it('should go to next step each time, then call `onSetupFinish` last time', () => {
                const onSetupFinish = vi.fn();
                const { result } = renderHook(() => useWalletSetupModal({ isOpen: true, onSetupFinish }));

                act(() => result.current.onSelectSetupMode(WalletSetupMode.Import));

                act(() => result.current.onNextStep());
                expect(result.current.currentStep).toBe(WalletSetupStep.PassphraseInput);

                act(() => result.current.onNextStep());
                expect(result.current.currentStep).toBe(WalletSetupStep.WalletNameAndFiatInput);

                act(() => result.current.onNextStep());
                expect(result.current.currentStep).toBe(WalletSetupStep.Confirmation);

                act(() => result.current.onNextStep());
                expect(onSetupFinish).toHaveBeenCalledTimes(1);
                expect(onSetupFinish).toHaveBeenCalledWith();
            });
        });

        describe('Creation', () => {
            it('should go to next step each time, then call `onSetupFinish` last time', () => {
                const onSetupFinish = vi.fn();
                const { result } = renderHook(() => useWalletSetupModal({ isOpen: true, onSetupFinish }));

                act(() => result.current.onSelectSetupMode(WalletSetupMode.Creation));

                act(() => result.current.onNextStep());
                expect(result.current.currentStep).toBe(WalletSetupStep.MnemonicBackup);

                act(() => result.current.onNextStep());
                expect(result.current.currentStep).toBe(WalletSetupStep.PassphraseInput);

                act(() => result.current.onNextStep());
                expect(result.current.currentStep).toBe(WalletSetupStep.WalletNameAndFiatInput);

                act(() => result.current.onNextStep());
                expect(result.current.currentStep).toBe(WalletSetupStep.Confirmation);

                act(() => result.current.onNextStep());
                expect(onSetupFinish).toHaveBeenCalledTimes(1);
                expect(onSetupFinish).toHaveBeenCalledWith();
            });
        });
    });

    describe('onMnemonicGenerated', () => {
        it.todo('should set mnemonic');
        it.todo('should jump to next step');
    });

    describe('onSaveNewWallet', () => {
        it.todo('should set passphrase');
        it.todo('should call API to create a wallet');
        it.todo('should jump to next step');

        describe('when passphrase is non-null', () => {
            it.todo('should call API to create a wallet with passphrase');
        });
    });
});
