import { act } from 'react';

import { renderHook } from '@testing-library/react-hooks';

import { type Recipient } from '@proton/shared/lib/interfaces';

import { InvalidRecipientErrorCode, useEmailAndBtcAddressesMaps } from './useEmailAndBtcAddressesMaps';

const recipient: Recipient = { Name: 'test name', Address: 'MyTestadrres+10@proton.me' };

describe('useEmailAndBtcAddressesMaps', () => {
    it('should add valid recipient with canonicalised email as key', () => {
        const { result } = renderHook(() => useEmailAndBtcAddressesMaps());

        expect(result.current.exists(recipient)).toBeFalsy();
        result.current.addValidRecipient(recipient, 'bc1q...');

        expect(result.current.recipientEmailMap).toStrictEqual({
            'mytestadrres@proton.me': {
                addressKey: undefined,
                btcAddress: {
                    value: 'bc1q...',
                },
                recipient: {
                    Address: 'MyTestadrres+10@proton.me',
                    Name: 'test name',
                },
            },
        });

        expect(result.current.btcAddressMap).toStrictEqual({
            'bc1q...': {
                addressKey: undefined,
                btcAddress: {
                    value: 'bc1q...',
                },
                recipient: {
                    Address: 'MyTestadrres+10@proton.me',
                    Name: 'test name',
                },
            },
        });

        expect(result.current.exists(recipient)).toBeTruthy();
    });

    it('should add invalid recipient with canonicalised email as key', () => {
        const { result } = renderHook(() => useEmailAndBtcAddressesMaps());

        expect(result.current.exists(recipient)).toBeFalsy();
        result.current.addInvalidRecipient(
            recipient,
            InvalidRecipientErrorCode.CouldNotFindBitcoinAddressLinkedToEmail
        );

        expect(result.current.recipientEmailMap).toStrictEqual({
            'mytestadrres@proton.me': {
                btcAddress: {
                    error: InvalidRecipientErrorCode.CouldNotFindBitcoinAddressLinkedToEmail,
                },
                recipient: {
                    Address: 'MyTestadrres+10@proton.me',
                    Name: 'test name',
                },
            },
        });

        expect(result.current.exists(recipient)).toBeTruthy();
    });

    it('should add remove recipient', () => {
        const { result } = renderHook(() => useEmailAndBtcAddressesMaps());

        result.current.addValidRecipient(recipient, 'bc1q...');
        expect(result.current.exists(recipient)).toBeTruthy();

        act(() => result.current.removeRecipient(recipient));
        expect(result.current.exists(recipient)).toBeFalsy();
    });
});
