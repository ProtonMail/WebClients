import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Input } from '@proton/atoms/Input/Input';

import { WasmRecipient } from '../../../../pkg';
import { BitcoinAmountInput } from '../../../atoms/BitcoinAmountInput';
import { RecipientUpdate } from '../../../hooks/useRecipients';

interface Props {
    recipients: WasmRecipient[];
    onRecipientAddition?: () => Promise<void>;
    onRecipientRemove?: (index: number) => Promise<void>;
    onRecipientMaxAmount?: (index: number) => Promise<void>;
    onRecipientUpdate?: (index: number, update: RecipientUpdate) => Promise<void>;
}

export const RecipientList = ({
    recipients,
    onRecipientAddition,
    onRecipientRemove,
    onRecipientUpdate,
    onRecipientMaxAmount,
}: Props) => {
    return (
        <ul className="unstyled m-0 mt-2 mb-4 p-0 h-custom overflow-y-auto" style={{ '--h-custom': '14rem' }}>
            {recipients.map((recipient, index) => {
                const isLastRecipientItem = index === recipients.length - 1;
                const recipientUnit = recipient[3];

                const showAddRemoveButton = isLastRecipientItem ? !!onRecipientAddition : !!onRecipientRemove;

                return (
                    <li className="overflow-hidden pb-3 border-bottom border-weak" key={recipient[0]}>
                        <div className="flex flex-row">
                            <div className="w-2/3">
                                <Input
                                    data-testid="recipient-address-input"
                                    placeholder={c('Wallet Send').t`Recipient address`}
                                    value={recipient[1]}
                                    disabled={!onRecipientUpdate}
                                    onChange={(event) => {
                                        void onRecipientUpdate?.(index, { address: event.target.value });
                                    }}
                                />
                            </div>
                            {showAddRemoveButton && (
                                <Button
                                    className="ml-auto mr-2"
                                    shape="underline"
                                    color="norm"
                                    onClick={
                                        isLastRecipientItem
                                            ? () => onRecipientAddition?.()
                                            : () => onRecipientRemove?.(index)
                                    }
                                >
                                    {isLastRecipientItem
                                        ? c('Wallet Send').t`Add recipient`
                                        : c('Wallet Send').t`Remove recipient`}
                                </Button>
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
                                unit={recipientUnit}
                                onUnitChange={
                                    onRecipientUpdate &&
                                    ((unit) => {
                                        void onRecipientUpdate(index, { unit });
                                    })
                                }
                            />
                        </div>
                    </li>
                );
            })}
        </ul>
    );
};
