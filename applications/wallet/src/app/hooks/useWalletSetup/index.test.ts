import { act, renderHook } from '@testing-library/react-hooks';
import { vi } from 'vitest';

import { mockUseNotifications, mockUseUser, mockUseUserKey } from '@proton/testing/lib/vitest';

import { useWalletSetup } from '.';
import { mockUseBitcoinBlockchainContext, mockUseWalletApi, mockUseWalletDispatch } from '../../tests/mocks';
import { mockUseDecryptedWallets } from '../../tests/mocks/useDecryptedWallet';
import { WalletSetupScheme, WalletSetupStep } from './type';

describe('useWalletSetupModal', () => {
    beforeEach(() => {
        mockUseNotifications();
        mockUseUser();
        mockUseUserKey();
        mockUseWalletDispatch();
        mockUseDecryptedWallets();
        mockUseBitcoinBlockchainContext();
        mockUseWalletApi();
    });

    describe('onSetupSchemeChange', () => {
        describe('when Creation is selected', () => {
            it("should set mode and move to mod's first step", () => {
                const { result } = renderHook(() => useWalletSetup({ onSetupFinish: vi.fn() }));

                act(() => {
                    result.current.onSetupSchemeChange(WalletSetupScheme.ManualCreation);
                });

                expect(result.current.schemeAndData).toStrictEqual({ scheme: WalletSetupScheme.ManualCreation });
                expect(result.current.step).toBe(WalletSetupStep.MnemonicBackup);
            });
        });

        describe('when Import is selected', () => {
            it("should set mode and move to mod's first step", () => {
                const { result } = renderHook(() => useWalletSetup({ onSetupFinish: vi.fn() }));

                act(() => {
                    result.current.onSetupSchemeChange(WalletSetupScheme.WalletImport);
                });

                expect(result.current.schemeAndData).toStrictEqual({ scheme: WalletSetupScheme.WalletImport });
                expect(result.current.step).toBe(WalletSetupStep.MnemonicInput);
            });
        });
    });

    describe('onNextStep', () => {
        describe('Import', () => {
            it('should go to next step each time, then call `onSetupFinish` last time', () => {
                const onSetupFinish = vi.fn();
                const { result } = renderHook(() => useWalletSetup({ onSetupFinish }));

                act(() => result.current.onSetupSchemeChange(WalletSetupScheme.WalletImport));

                act(() => result.current.onNextStep());
                expect(result.current.step).toBe(WalletSetupStep.PassphraseInput);

                act(() => result.current.onNextStep());
                expect(result.current.step).toBe(WalletSetupStep.Settings);

                act(() => result.current.onNextStep());
                expect(onSetupFinish).toHaveBeenCalledTimes(1);
                expect(onSetupFinish).toHaveBeenCalledWith();
            });
        });

        describe('Creation', () => {
            it('should go to next step each time, then call `onSetupFinish` last time', () => {
                const onSetupFinish = vi.fn();
                const { result } = renderHook(() => useWalletSetup({ onSetupFinish }));

                act(() => result.current.onSetupSchemeChange(WalletSetupScheme.ManualCreation));

                act(() => result.current.onNextStep());
                expect(result.current.step).toBe(WalletSetupStep.PassphraseInput);

                act(() => result.current.onNextStep());
                expect(result.current.step).toBe(WalletSetupStep.Settings);

                act(() => result.current.onNextStep());
                expect(onSetupFinish).toHaveBeenCalledTimes(1);
                expect(onSetupFinish).toHaveBeenCalledWith();
            });
        });
    });
});
