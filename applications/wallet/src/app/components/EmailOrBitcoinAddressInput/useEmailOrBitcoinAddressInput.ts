import { useCallback, useMemo, useState } from 'react';

import type { QRCode } from 'jsqr';
import compact from 'lodash/compact';
import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import type { WasmNetwork } from '@proton/andromeda';
import {
    getContactsAutocompleteItems,
    getRecipientFromAutocompleteItem,
} from '@proton/components/components/addressesAutocomplete/helper';
import type { AddressesAutocompleteItem } from '@proton/components/components/addressesAutocomplete/helper';
import { useAutocompleteFilter } from '@proton/components/components/autocomplete/useAutocomplete';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { canonicalizeEmail, canonicalizeEmailByGuess, validateEmailAddress } from '@proton/shared/lib/helpers/email';
import type { Address, Recipient } from '@proton/shared/lib/interfaces';
import type { ContactEmail } from '@proton/shared/lib/interfaces/contacts';
import { inputToRecipient, splitBySeparator } from '@proton/shared/lib/mail/recipient';

import { isValidBitcoinAddress } from '../../utils';
import { isSelfAddress } from '../../utils/email';
import type { RecipientEmailMap } from '../BitcoinSendModal/useEmailAndBtcAddressesMaps';

import './EmailOrBitcoinAddressInput.scss';

export interface RecipientWithBtcAddress extends Recipient {
    btcAddress: { value?: string; error?: string };
}

const validateInput = (input: string, addresses: Address[], network: WasmNetwork) => {
    if (validateEmailAddress(input)) {
        if (isSelfAddress(input, addresses)) {
            return c('Error').t`Bitcoin via Email to self is not supported`;
        }
    } else if (!isValidBitcoinAddress(input, network)) {
        return c('Error').t`Input isn't a valid email or bitcoin address`;
    }
};

const getData = (value: { label: string }) => value.label;

export const useEmailOrBitcoinAddressInput = ({
    contactEmails,
    recipientEmailMap,
    limit = 10,
    onAddRecipients,
    excludedEmails = [],
    network,
}: {
    onAddRecipients: (recipients: Recipient[]) => void;
    recipientEmailMap: RecipientEmailMap;
    contactEmails?: ContactEmail[];
    excludedEmails?: string[];
    limit?: number;
    network: WasmNetwork;
}) => {
    const [input, setInput] = useState('');
    const [emailError, setEmailError] = useState('');

    const [addresses = []] = useAddresses();

    const [qrCodeModal, setQrCodeModal] = useModalState();

    const recipientsWithBtcAddress = compact(Object.values(recipientEmailMap));

    const [recipientsByAddress] = useMemo(() => {
        return recipientsWithBtcAddress.reduce<[Set<string>, Set<string>]>(
            (acc, { recipient: { Address } }) => {
                if (Address) {
                    acc[0].add(canonicalizeEmail(Address));
                }

                return acc;
            },
            [new Set(), new Set()]
        );
    }, [recipientsWithBtcAddress]);

    const contactsAutocompleteItems = useMemo(() => {
        const filteredContactEmails = contactEmails?.filter(({ Email }) => !excludedEmails.includes(Email));

        return getContactsAutocompleteItems(filteredContactEmails, ({ Email }) => {
            return (
                !recipientsByAddress.has(canonicalizeEmailByGuess(Email)) && !validateInput(Email, addresses, network)
            );
        });
    }, [contactEmails, excludedEmails, recipientsByAddress, addresses, network]);

    const filteredOptions = useAutocompleteFilter(input, contactsAutocompleteItems, getData, limit, 1);

    const safeAddRecipients = useCallback(
        (newRecipients: Recipient[]) => {
            const recipients = newRecipients.filter(({ Address }) => {
                return !validateInput(Address || '', addresses, network);
            });

            if (recipients.length) {
                setInput('');
                setEmailError('');
                onAddRecipients(recipients);
            }
        },
        [onAddRecipients, addresses, network]
    );

    const handleAddRecipientFromSelect = useCallback(
        (item: AddressesAutocompleteItem) => {
            safeAddRecipients(getRecipientFromAutocompleteItem(contactEmails, item));
        },
        [safeAddRecipients, contactEmails]
    );

    const handleAddRecipientFromInput = (input: string) => {
        const trimmedInput = input.trim();
        if (!trimmedInput.length) {
            setInput('');
            return;
        }

        const inputs = splitBySeparator(trimmedInput);

        const recipients = inputs.map((input) => inputToRecipient(input));
        const { validRecipients, invalidRecipients, errors } = recipients.reduce<{
            validRecipients: Recipient[];
            invalidRecipients: Recipient[];
            errors: string[];
        }>(
            (acc, recipient) => {
                const error = validateInput(recipient.Address || '', addresses, network);
                if (error) {
                    acc.errors.push(error);
                    acc.invalidRecipients.push(recipient);
                } else {
                    acc.validRecipients.push(recipient);
                }
                return acc;
            },
            { validRecipients: [], invalidRecipients: [], errors: [] }
        );

        safeAddRecipients(validRecipients);

        if (errors.length) {
            setEmailError(errors[0]);
            setInput(invalidRecipients.map(({ Address }) => Address).join(', '));
        }
    };

    const handleAddRecipientFromScan = (qrcode: QRCode) => {
        const value = qrcode.data.trimStart();
        handleAddRecipientFromInput(value);

        qrCodeModal.onClose();
    };

    return {
        input,
        setInput,

        emailError,
        setEmailError,

        recipientsWithBtcAddress,

        filteredOptions,

        qrCodeModal,
        setQrCodeModal,

        handleAddRecipientFromSelect,
        handleAddRecipientFromInput,
        handleAddRecipientFromScan,
    };
};
