import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Input } from '@proton/atoms/Input';
import { ButtonGroup } from '@proton/components/components';

import { BitcoinUnit, Wallet } from '../../types';
import { TempRecipient, useOnchainTransactionBuilder } from './useOnchainTransactionBuilder';

interface Props {
    selectedWallet: Wallet;
    recipients: TempRecipient[];
    onRecipientAddition: ReturnType<typeof useOnchainTransactionBuilder>['addRecipient'];
    onRecipientUpdate: ReturnType<typeof useOnchainTransactionBuilder>['updateRecipient'];
    onRecipientAmountUpdate: ReturnType<typeof useOnchainTransactionBuilder>['updateRecipientAmount'];
    onRecipientRemove: ReturnType<typeof useOnchainTransactionBuilder>['removeRecipient'];
}

export const RecipientList = ({
    selectedWallet,
    recipients,
    onRecipientUpdate,
    onRecipientAmountUpdate,
    onRecipientAddition,
    onRecipientRemove,
}: Props) => {
    return (
        <ul className="unstyled m-0 my-4 p-0 h-custom overflow-y-auto" style={{ '--h-custom': '14rem' }}>
            {recipients.map((recipient, index) => {
                const isLastRecipientItem = index === recipients.length - 1;

                return (
                    <li className="overflow-hidden py-3 border-bottom border-weak" key={recipient.uuid}>
                        <div className="flex flex-row">
                            <div className="w-2/3">
                                <Input
                                    data-testid="recipient-address-input"
                                    placeholder={c('Wallet Send').t`Recipient address`}
                                    value={recipient.address}
                                    onChange={(event) => {
                                        onRecipientUpdate(index, { address: event.target.value });
                                    }}
                                />
                            </div>
                            <Button
                                className="ml-auto mr-2"
                                shape="underline"
                                color="norm"
                                onClick={
                                    isLastRecipientItem ? () => onRecipientAddition() : () => onRecipientRemove(index)
                                }
                            >
                                {isLastRecipientItem
                                    ? c('Wallet Send').t`Add recipient`
                                    : c('Wallet Send').t`Remove recipient`}
                            </Button>
                        </div>
                        <div className="flex flex-row mt-2">
                            <div className="w-custom" style={{ '--w-custom': '10rem' }}>
                                <Input
                                    data-testid="recipient-amount-input"
                                    placeholder={c('Wallet Send').t`Amount`}
                                    type="number"
                                    min={0}
                                    value={recipient.amount}
                                    onChange={(event) => {
                                        onRecipientAmountUpdate(index, parseInt(event.target.value));
                                    }}
                                />
                            </div>
                            <ButtonGroup className="ml-3">
                                <Button
                                    data-testid="recipient-sats-display-button"
                                    selected={recipient.unit === BitcoinUnit.SATS}
                                    onClick={() => {
                                        onRecipientUpdate(index, { unit: BitcoinUnit.SATS });
                                    }}
                                >
                                    SATS
                                </Button>
                                <Button
                                    data-testid="recipient-btc-display-button"
                                    selected={recipient.unit === BitcoinUnit.BTC}
                                    onClick={() => {
                                        onRecipientUpdate(index, { unit: BitcoinUnit.BTC });
                                    }}
                                >
                                    BTC
                                </Button>
                            </ButtonGroup>
                            {recipients.length === 1 && (
                                <Button
                                    className="ml-3"
                                    shape="underline"
                                    color="norm"
                                    onClick={() => {
                                        onRecipientAmountUpdate(index, selectedWallet.balance);
                                    }}
                                >{c('Wallet Send').t`Maximum amount`}</Button>
                            )}
                        </div>
                    </li>
                );
            })}
        </ul>
    );
};
