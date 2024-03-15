import { c } from 'ttag';

import { WasmRecipient } from '@proton/andromeda';
import { Button } from '@proton/atoms/Button/Button';
import { Input } from '@proton/atoms/Input/Input';
import { Scroll } from '@proton/atoms/Scroll';
import isTruthy from '@proton/utils/isTruthy';

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
