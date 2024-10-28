import { act } from 'react';

import { renderHook } from '@testing-library/react';

import { WasmTxBuilder } from '@proton/andromeda';
import { type PublicKeyReference } from '@proton/crypto/lib';
import { setupCryptoProxyForTesting } from '@proton/pass/lib/crypto/utils/testing';
import type { Recipient } from '@proton/shared/lib/interfaces';
import { mockUseNotifications } from '@proton/testing/lib/vitest';
import { getAddressKey, mockUseBitcoinNetwork, mockUseWalletApiClients } from '@proton/wallet/tests';

import { type TxBuilderHelper } from '../../../hooks/useTxBuilder';
import { mockUseGetRecipientVerifiedAddressKey } from '../../../tests/mocks/useGetRecipientVerifiedAddressKey';
import type { RecipientEmailMap, useEmailAndBtcAddressesMaps } from '../useEmailAndBtcAddressesMaps';
import { useRecipientsSelectionStep } from './useRecipientsSelectionStep';

describe('useRecipientsSelectionStep', () => {
    beforeAll(async () => {
        await setupCryptoProxyForTesting();
    });

    beforeEach(() => {
        mockUseGetRecipientVerifiedAddressKey();
        mockUseBitcoinNetwork();
        mockUseWalletApiClients();
        mockUseNotifications();

        vi.clearAllMocks();
    });

    describe('handleAddRecipients', () => {
        let txBuilder: WasmTxBuilder;
        let publicKey: PublicKeyReference;

        const mockLookupBitcoinAddress = vi
            .fn()
            .mockResolvedValue({ Data: { BitcoinAddress: 'bc1a', BitcoinAddressSignature: 'fake sig' } });

        const mockUpdateTxBuilder = vi.fn().mockImplementation((updater) => (txBuilder = updater(txBuilder)));

        const mockAddValidRecipient = vi.fn();
        const mockExists = vi.fn();

        beforeEach(async () => {
            txBuilder = new WasmTxBuilder();
            publicKey = await getAddressKey().then(({ keys }) => keys[0].publicKey);

            mockUseWalletApiClients({ email_integration: { lookupBitcoinAddress: mockLookupBitcoinAddress } });
            mockUseGetRecipientVerifiedAddressKey(vi.fn().mockResolvedValue(publicKey));
        });

        it('should add a recipient by email address', async () => {
            const { result } = renderHook(() =>
                useRecipientsSelectionStep({
                    recipientHelpers: {
                        recipientEmailMap: {},
                        addInvalidRecipient: vi.fn(),
                        addValidRecipient: mockAddValidRecipient,
                        exists: mockExists,
                    } as unknown as ReturnType<typeof useEmailAndBtcAddressesMaps>,
                    txBuilderHelpers: {
                        txBuilder,
                        updateTxBuilder: mockUpdateTxBuilder,
                        updateTxBuilderAsync: vi.fn(),
                    } as unknown as TxBuilderHelper,
                })
            );

            await act(() => result.current.handleAddRecipients([{ Address: 'bc1a@proton.me' } as Recipient]));

            expect(mockAddValidRecipient).toHaveBeenCalledTimes(1);
            expect(mockAddValidRecipient).toHaveBeenCalledWith({ Address: 'bc1a@proton.me' }, 'bc1a', publicKey);
        });

        it('should add a recipient by btc address', async () => {
            const { result } = renderHook(() =>
                useRecipientsSelectionStep({
                    recipientHelpers: {
                        recipientEmailMap: {},
                        addInvalidRecipient: vi.fn(),
                        addValidRecipient: mockAddValidRecipient,
                        exists: mockExists,
                    } as unknown as ReturnType<typeof useEmailAndBtcAddressesMaps>,
                    txBuilderHelpers: {
                        txBuilder,
                        updateTxBuilder: mockUpdateTxBuilder,
                        updateTxBuilderAsync: vi.fn(),
                    } as unknown as TxBuilderHelper,
                })
            );

            await act(() =>
                result.current.handleAddRecipients([
                    { Address: 'tb1qlj64u6fqutr0xue85kl55fx0gt4m4urun25p7q' } as Recipient,
                ])
            );

            expect(mockAddValidRecipient).toHaveBeenCalledTimes(1);
            expect(mockAddValidRecipient).toHaveBeenCalledWith(
                { Address: 'tb1qlj64u6fqutr0xue85kl55fx0gt4m4urun25p7q' },
                'tb1qlj64u6fqutr0xue85kl55fx0gt4m4urun25p7q',
                undefined
            );
        });

        it('should not add a recipient if already exists', async () => {
            const { result } = renderHook(() =>
                useRecipientsSelectionStep({
                    recipientHelpers: {
                        recipientEmailMap: {},
                        addInvalidRecipient: vi.fn(),
                        addValidRecipient: mockAddValidRecipient,
                        exists: mockExists,
                    } as unknown as ReturnType<typeof useEmailAndBtcAddressesMaps>,
                    txBuilderHelpers: {
                        txBuilder,
                        updateTxBuilder: mockUpdateTxBuilder,
                        updateTxBuilderAsync: vi.fn(),
                    } as unknown as TxBuilderHelper,
                })
            );

            mockExists.mockReturnValue(true);

            await act(() => result.current.handleAddRecipients([{ Address: 'bc1a@proton.me' } as Recipient]));
            expect(mockAddValidRecipient).toHaveBeenCalledTimes(0);
        });
    });

    describe('handleRemoveRecipient', () => {
        let txBuilder: WasmTxBuilder;

        const mockUpdateTxBuilder = vi.fn().mockImplementation((updater) => (txBuilder = updater(txBuilder)));
        const mockRemoveRecipient = vi.fn();

        const recipientA: Recipient = { Name: 'bc1a', Address: 'bc1a@proton.me' };
        const recipientB: Recipient = { Name: 'bc1b', Address: 'bc1b@proton.me' };
        const recipientC: Recipient = { Name: 'bc1c', Address: 'bc1c@proton.me' };

        const recipientsMap: RecipientEmailMap = {
            'bc1a@proton.me': { btcAddress: { value: 'bc1a' }, recipient: recipientA },
            'bc1b@proton.me': { btcAddress: { value: 'bc1b' }, recipient: recipientB },
            'bc1c@proton.me': { btcAddress: { value: 'bc1c' }, recipient: recipientC },
        };

        beforeEach(() => {
            txBuilder = new WasmTxBuilder()
                .clearRecipients()
                .addRecipient('bc1a', BigInt(30_000))
                .addRecipient('bc1b', BigInt(60_000))
                .addRecipient('bc1c', BigInt(90_000));
        });

        it('should remove one recipient', () => {
            const { result } = renderHook(() =>
                useRecipientsSelectionStep({
                    recipientHelpers: {
                        recipientEmailMap: recipientsMap,
                        removeRecipient: mockRemoveRecipient,
                    } as unknown as ReturnType<typeof useEmailAndBtcAddressesMaps>,
                    txBuilderHelpers: {
                        txBuilder,
                        updateTxBuilder: mockUpdateTxBuilder,
                        updateTxBuilderAsync: vi.fn(),
                    } as unknown as TxBuilderHelper,
                })
            );

            act(() => result.current.handleRemoveRecipient(recipientB));

            expect(txBuilder.getRecipients()).toHaveLength(2);
            expect(txBuilder.getRecipients().find((r) => r[1] === 'bc1a')).toBeTruthy();
            expect(txBuilder.getRecipients().find((r) => r[1] === 'bc1c')).toBeTruthy();

            expect(mockRemoveRecipient).toHaveBeenCalledTimes(1);
            expect(mockRemoveRecipient).toHaveBeenCalledWith({
                Address: 'bc1b@proton.me',
                Name: 'bc1b',
            });
        });
    });
});
