import { act } from 'react';

import { waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import type { QRCode } from 'jsqr';

import { WasmNetwork } from '@proton/andromeda';
import { mockUseAddresses } from '@proton/testing/lib/vitest';

import { useEmailOrBitcoinAddressInput } from './useEmailOrBitcoinAddressInput';

describe('useEmailOrBitcoinAddressInput', () => {
    const mockAddRecipient = vi.fn();
    beforeEach(() => {
        mockUseAddresses();

        vi.clearAllMocks();
    });

    it('should add valid email addresses from input', async () => {
        const { result } = renderHook(() =>
            useEmailOrBitcoinAddressInput({
                contactEmails: [],
                recipientEmailMap: {},
                onAddRecipients: mockAddRecipient,
                network: WasmNetwork.Testnet,
            })
        );

        act(() =>
            result.current.handleAddRecipientFromInput(
                'eric.norbet@pm.me; jo.dalton@protonmail.com; alexRider@proton.me'
            )
        );

        await waitFor(() => expect(mockAddRecipient).toHaveBeenCalledTimes(1));
        expect(mockAddRecipient).toHaveBeenCalledWith([
            {
                Address: 'eric.norbet@pm.me',
                Name: 'eric.norbet@pm.me',
            },
            {
                Address: 'jo.dalton@protonmail.com',
                Name: 'jo.dalton@protonmail.com',
            },
            {
                Address: 'alexRider@proton.me',
                Name: 'alexRider@proton.me',
            },
        ]);
    });

    it('should add valid bitcoin address from input', async () => {
        const { result } = renderHook(() =>
            useEmailOrBitcoinAddressInput({
                contactEmails: [],
                recipientEmailMap: {},
                onAddRecipients: mockAddRecipient,
                network: WasmNetwork.Testnet,
            })
        );

        act(() =>
            result.current.handleAddRecipientFromInput(
                'tb1qm3qzhvwfj3lycdxjyrd9ll8u5v0m8yd20xfmld; tb1q28cw58duzas8k522xpjqqj5xcmpfazr0rd0p89'
            )
        );

        await waitFor(() => expect(mockAddRecipient).toHaveBeenCalledTimes(1));
        expect(mockAddRecipient).toHaveBeenCalledWith([
            {
                Address: 'tb1qm3qzhvwfj3lycdxjyrd9ll8u5v0m8yd20xfmld',
                Name: 'tb1qm3qzhvwfj3lycdxjyrd9ll8u5v0m8yd20xfmld',
            },
            {
                Address: 'tb1q28cw58duzas8k522xpjqqj5xcmpfazr0rd0p89',
                Name: 'tb1q28cw58duzas8k522xpjqqj5xcmpfazr0rd0p89',
            },
        ]);
    });

    it('should not add invalid recipient from input', async () => {
        const { result } = renderHook(() =>
            useEmailOrBitcoinAddressInput({
                contactEmails: [],
                recipientEmailMap: {},
                onAddRecipients: mockAddRecipient,
                network: WasmNetwork.Testnet,
            })
        );

        act(() =>
            result.current.handleAddRecipientFromInput(
                'tb1qm3qzhvwfj3lycdxjyrd9ll8u5v0m8yd20xfml; tb1q28cw58duzas8k522xpjqqj5xcmpfazr0rd0p89'
            )
        );

        await waitFor(() => expect(mockAddRecipient).toHaveBeenCalledTimes(1));
        expect(mockAddRecipient).toHaveBeenCalledWith([
            {
                Address: 'tb1q28cw58duzas8k522xpjqqj5xcmpfazr0rd0p89',
                Name: 'tb1q28cw58duzas8k522xpjqqj5xcmpfazr0rd0p89',
            },
        ]);

        expect(result.current.emailError).toBe("Input isn't a valid email or bitcoin address");
        // keep input value so that user can still modify it
        expect(result.current.input).toBe('tb1qm3qzhvwfj3lycdxjyrd9ll8u5v0m8yd20xfml');

        act(() => result.current.handleAddRecipientFromInput('alexRider@'));

        expect(result.current.emailError).toBe("Input isn't a valid email or bitcoin address");
        // keep input value so that user can still modify it
        expect(result.current.input).toBe('alexRider@');
    });

    it('should close qr modal when handling add recipient from scan', async () => {
        const { result } = renderHook(() =>
            useEmailOrBitcoinAddressInput({
                contactEmails: [],
                recipientEmailMap: {},
                onAddRecipients: mockAddRecipient,
                network: WasmNetwork.Testnet,
            })
        );

        act(() => result.current.setQrCodeModal(true));
        act(() =>
            result.current.handleAddRecipientFromScan({ data: 'tb1q28cw58duzas8k522xpjqqj5xcmpfazr0rd0p89' } as QRCode)
        );

        await waitFor(() => expect(mockAddRecipient).toHaveBeenCalledTimes(1));
        expect(mockAddRecipient).toHaveBeenCalledWith([
            {
                Address: 'tb1q28cw58duzas8k522xpjqqj5xcmpfazr0rd0p89',
                Name: 'tb1q28cw58duzas8k522xpjqqj5xcmpfazr0rd0p89',
            },
        ]);

        expect(result.current.qrCodeModal.open).toBeFalsy();
    });
});
