import { c } from 'ttag';

import { WasmRecipient } from '@proton/andromeda';
import { Button } from '@proton/atoms/Button/Button';
import { Input } from '@proton/atoms/Input/Input';
import { Scroll } from '@proton/atoms/Scroll';
import AddressesAutocompleteTwo from '@proton/components/components/v2/addressesAutocomplete/AddressesAutocomplete';
import { useContactEmailsCache } from '@proton/components/containers/contacts/ContactEmailsProvider';
import { useNotifications } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import { Recipient } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';
import { useWalletApi } from '@proton/wallet';

import { BitcoinAmountInput } from '../../../atoms/BitcoinAmountInput';
import { RecipientUpdate } from '../../../hooks/useRecipients';
import { useUserExchangeRate } from '../../../hooks/useUserExchangeRate';

interface Props {
    title: string;
    recipients: WasmRecipient[];
    onRecipientAddition?: () => Promise<void>;
    onRecipientRemove?: (index: number) => Promise<void>;
    onRecipientMaxAmount?: (index: number) => Promise<void>;
    onRecipientUpdate?: (index: number, update: RecipientUpdate) => Promise<void>;
}

export const RecipientList = ({
    title,
    recipients,
    onRecipientAddition,
    onRecipientRemove,
    onRecipientUpdate,
    onRecipientMaxAmount,
}: Props) => {
    const [exchangeRate] = useUserExchangeRate();
    const { contactEmails, contactEmailsMap } = useContactEmailsCache();
    const { createNotification } = useNotifications();
    const [loadingBitcoinAddressLookup, withLoadingBitcoinAddressLookup] = useLoading();
    const api = useWalletApi();

    const handleAddRecipients = async (index: number, recipientOrBitcoinAddress: Recipient) => {
        if (validateEmailAddress(recipientOrBitcoinAddress?.Address)) {
            try {
                const bitcoinAddress = await api
                    .email_integration()
                    .lookupBitcoinAddress(recipientOrBitcoinAddress.Address);

                // TODO: check bitcoin BitcoinAddressSignature here!
                if (bitcoinAddress.Data.BitcoinAddress) {
                    await onRecipientUpdate?.(index, {
                        address: bitcoinAddress.Data.BitcoinAddress,
                    });
                } else {
                    throw new Error('no address set on this BitcoinAddress');
                }
            } catch {
                createNotification({
                    type: 'error',
                    text: c('Send bitcoin').t`Could not find address linked to this email`,
                });
            }
        } else {
            await onRecipientUpdate?.(index, {
                address: recipientOrBitcoinAddress.Address,
            });
        }
    };

    return (
        <div className="flex flex-column my-4 flex-1 flex-nowrap">
            <h3 className="text-rg text-semibold mb-2">{title}</h3>

            <Scroll className="h-full">
                <div className="h-full flex flex-column">
                    <ul className="unstyled m-0 mt-2 mb-4 p-0">
                        {recipients.map((recipient, index) => {
                            return (
                                <li className="overflow-hidden py-3 border-bottom border-weak" key={recipient[0]}>
                                    <div className="flex flex-row">
                                        <div className="flex flex-column flex-auto">
                                            <div>
                                                {recipient[1] ? (
                                                    <Input
                                                        data-testid="recipient-address-input"
                                                        placeholder={c('Wallet Send').t`Recipient address`}
                                                        value={recipient[1]}
                                                        disabled={!onRecipientUpdate}
                                                        onChange={(event) => {
                                                            void onRecipientUpdate?.(index, {
                                                                address: event.target.value,
                                                            });
                                                        }}
                                                    />
                                                ) : (
                                                    <AddressesAutocompleteTwo
                                                        id="recipient-address-input-autocomplete"
                                                        data-testid="recipient-address-input-autocomplete"
                                                        disabled={loadingBitcoinAddressLookup}
                                                        hasAddOnBlur
                                                        placeholder={'proton email or bitcoin address'}
                                                        contactEmails={contactEmails}
                                                        contactEmailsMap={contactEmailsMap}
                                                        recipients={[]}
                                                        onAddRecipients={([r]) => {
                                                            void withLoadingBitcoinAddressLookup(
                                                                handleAddRecipients(index, r)
                                                            );
                                                        }}
                                                    />
                                                )}
                                            </div>

                                            <div className="flex flex-row mt-2">
                                                <BitcoinAmountInput
                                                    value={Number(recipient[2])}
                                                    disabled={!onRecipientUpdate}
                                                    onValueChange={(amount) => {
                                                        void onRecipientUpdate?.(index, { amount });
                                                    }}
                                                    onMaxValue={
                                                        onRecipientMaxAmount && recipients.length === 1
                                                            ? () => {
                                                                  void onRecipientMaxAmount(index);
                                                              }
                                                            : undefined
                                                    }
                                                    exchangeRates={[exchangeRate].filter(isTruthy)}
                                                />
                                            </div>
                                        </div>

                                        {!!onRecipientRemove && (
                                            <Button
                                                className="ml-3"
                                                shape="underline"
                                                color="norm"
                                                disabled={recipients.length <= 1}
                                                onClick={() => onRecipientRemove(index)}
                                            >
                                                {c('Wallet Send').t`Remove recipient`}
                                            </Button>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>

                    {!!onRecipientAddition && (
                        <Button
                            className="mx-auto"
                            shape="underline"
                            color="norm"
                            onClick={() => onRecipientAddition()}
                        >
                            {c('Wallet Send').t`Add recipient`}
                        </Button>
                    )}
                </div>
            </Scroll>
        </div>
    );
};
