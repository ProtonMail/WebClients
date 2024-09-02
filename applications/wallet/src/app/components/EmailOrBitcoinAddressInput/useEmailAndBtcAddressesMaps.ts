import { useState } from 'react';

import omit from 'lodash/omit';

import type { PublicKeyReference } from '@proton/crypto/lib';
import { canonicalizeEmail } from '@proton/shared/lib/helpers/email';
import type { Recipient, SimpleMap } from '@proton/shared/lib/interfaces';

export enum InvalidRecipientErrorCode {
    NoAddressSetOnBitcoinAddress,
    NoSignatureSetOnBitcoinAddress,
    BitcoinAddressSignatureCouldNotBeVerified,
    CouldNotFindBitcoinAddressLinkedToEmail,
    InvalidAddress,
    CouldNotFindProtonWallet,
    NoBitcoinAddressAvailable,
}

export type BtcAddressOrError = { value?: string; error?: InvalidRecipientErrorCode };

export type MapItem = { btcAddress: BtcAddressOrError; recipient: Recipient; addressKey?: PublicKeyReference };

export type BtcAddressMap = SimpleMap<MapItem>;
export type RecipientEmailMap = Partial<Record<Recipient['Address'], MapItem>>;

interface Props {
    initBtcAddressMap?: BtcAddressMap;
    initRecipientEmailMap?: RecipientEmailMap;
}

export const useEmailAndBtcAddressesMaps = ({ initBtcAddressMap = {}, initRecipientEmailMap = {} }: Props = {}) => {
    const [btcAddressMap, setBtcAddressMap] = useState<BtcAddressMap>(initBtcAddressMap);
    const [recipientEmailMap, setRecipientEmailMap] = useState<RecipientEmailMap>(initRecipientEmailMap);
    const [recipientsEmailWithSentInvite, setRecipientsEmailWithSentInvite] = useState<Set<string>>(new Set());

    const checkHasSentInvite = (email: string) => {
        return recipientsEmailWithSentInvite.has(email);
    };

    const addRecipientWithSentInvite = (email: string) => {
        setRecipientsEmailWithSentInvite((p) => p.add(email));
    };

    const exists = (recipient: Recipient) => {
        return Boolean(recipientEmailMap[canonicalizeEmail(recipient.Address)] || btcAddressMap[recipient.Address]);
    };

    const addValidRecipient = (
        recipient: Recipient,
        value: BtcAddressOrError['value'],
        addressKey?: PublicKeyReference
    ) => {
        setRecipientEmailMap((prev) => ({
            ...prev,
            [canonicalizeEmail(recipient.Address)]: { btcAddress: { value }, recipient, addressKey },
        }));

        if (value) {
            setBtcAddressMap((prev) => ({ ...prev, [value]: { recipient, addressKey, btcAddress: { value } } }));
        }
    };

    const addInvalidRecipient = (recipient: Recipient, error: BtcAddressOrError['error']) => {
        setRecipientEmailMap((prev) => ({ ...prev, [recipient.Address]: { btcAddress: { error }, recipient } }));
    };

    const removeRecipient = (recipient: Recipient) => {
        const email = canonicalizeEmail(recipient.Address);
        const recipientToRemove = recipientEmailMap[email];

        setRecipientEmailMap((prev) => omit(prev, email));
        setBtcAddressMap((prev) => omit(prev, recipientToRemove?.btcAddress.value ?? ''));
    };

    return {
        recipientEmailMap,
        btcAddressMap,
        addValidRecipient,
        addInvalidRecipient,
        removeRecipient,
        exists,

        checkHasSentInvite,
        addRecipientWithSentInvite,
    };
};
