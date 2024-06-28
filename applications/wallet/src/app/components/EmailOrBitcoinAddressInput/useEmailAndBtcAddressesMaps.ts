import { useState } from 'react';

import { omit } from 'lodash';

import { PublicKeyReference } from '@proton/crypto/lib';
import { Recipient } from '@proton/shared/lib/interfaces';

export type BtcAddressOrError = { value?: string; error?: string };

export type MapItem = { btcAddress: BtcAddressOrError; recipient: Recipient; addressKey?: PublicKeyReference };

export type BtcAddressMap = Partial<Record<string, MapItem>>;
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
        return Boolean(recipientEmailMap[recipient.Address]);
    };

    const addValidRecipient = (
        recipient: Recipient,
        value: BtcAddressOrError['value'],
        addressKey?: PublicKeyReference
    ) => {
        setRecipientEmailMap((prev) => ({
            ...prev,
            [recipient.Address]: { btcAddress: { value }, recipient, addressKey },
        }));

        if (value) {
            setBtcAddressMap((prev) => ({ ...prev, [value]: { recipient, addressKey, btcAddress: { value } } }));
        }
    };

    const addInvalidRecipient = (recipient: Recipient, error: BtcAddressOrError['error']) => {
        setRecipientEmailMap((prev) => ({ ...prev, [recipient.Address]: { btcAddress: { error }, recipient } }));
    };

    const removeRecipient = (recipient: Recipient) => {
        const recipientToRemove = recipientEmailMap[recipient.Address];

        setRecipientEmailMap((prev) => omit(prev, recipient.Address));
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
