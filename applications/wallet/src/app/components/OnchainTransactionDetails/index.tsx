import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Card } from '@proton/atoms/Card';
import { Label, Price, TextAreaTwo, Tooltip } from '@proton/components/components';

import { WasmAccount, WasmAddress, WasmPartiallySignedTransaction } from '../../../pkg';
import { BitcoinAmount } from '../../atoms';
import { BitcoinUnit } from '../../types';
import { toFiat } from '../../utils';

interface Props {
    from: { walletName: string; accountName: string };
    account: WasmAccount;
    psbt: WasmPartiallySignedTransaction;
    onBack: () => void;
    onSignAndSend: () => void;
}

export const OnchainTransactionDetails = ({ from, account, psbt, onBack, onSignAndSend }: Props) => {
    const [note, setNode] = useState('');
    const totalAmount = psbt.recipients.reduce((acc, cur) => acc + cur[1], psbt.total_fees);

    return (
        <Card
            className="flex flex-column transaction-builder-card bg-norm flex-1 overflow-y-auto flex-nowrap mx-4"
            bordered={false}
            background={false}
            rounded
        >
            {/* From */}
            <div>
                <span className="text-sm color-hint">{c('Wallet Send - review').t`From`}</span>
                <div className="flex flex-row mt-1">
                    <span className="block px-3 py-1 mr-3 rounded bg-weak text-semibold">{from.walletName}</span>
                    <span className="block px-3 py-1 rounded bg-weak text-semibold">{from.accountName}</span>
                </div>
            </div>

            {/* To */}
            <div className="mt-4">
                <div className="flex flex-row w-full">
                    <span className="text-sm color-hint w-2/5 border-none">{c('Wallet Send - review')
                        .t`To recipients`}</span>
                    <span className="block w-1/5" title={c('Wallet Send - review').t`Is change output`} />
                    <span className="block w-1/5" title={c('Wallet Send - review').t`Fiat amount`} />
                    <span className="block w-1/5" title={c('Wallet Send - review').t`Sats amount`} />
                </div>

                <ul className="list-unstyled my-2 p-0">
                    {/* Recipients */}
                    {psbt.recipients
                        .filter((recipient) => {
                            const address = recipient[0];
                            return !account.owns(new WasmAddress(address));
                        })
                        .map((recipient, index) => {
                            const address = recipient[0];
                            return (
                                <li className="flex flex-row w-full" key={`${recipient[0]}_${recipient[1]}_${index}`}>
                                    <Tooltip title={address}>
                                        <span className="w-2/5 text-monospace">
                                            {address.slice(0, 10)}...{address.slice(-5)}
                                        </span>
                                    </Tooltip>
                                    <Price className="block w-1/5 color-hint" currency={'USD'}>
                                        {toFiat(Number(recipient[1])).toFixed(2)}
                                    </Price>
                                    <BitcoinAmount className="block w-1/5" unit={BitcoinUnit.SATS}>
                                        {Number(recipient[1])}
                                    </BitcoinAmount>
                                </li>
                            );
                        })}

                    {/* Fees */}
                    <li className="flex flex-row w-full mt-4 py-2 border-bottom border-top">
                        <span className="w-2/5">{c('Wallet Send - review').t`Fees`}</span>
                        <span className="block w-1/5" />
                        <Price className="block w-1/5 color-hint" currency={'USD'}>
                            {toFiat(Number(psbt.total_fees)).toFixed(2)}
                        </Price>
                        <BitcoinAmount className="block w-1/5" unit={BitcoinUnit.SATS}>
                            {Number(psbt.total_fees)}
                        </BitcoinAmount>
                    </li>

                    {/* Total */}
                    <li className="flex flex-row w-full mt-4 pt-2 border-bottom">
                        <span className="w-2/5">{c('Wallet Send - review').t`Total`}</span>
                        <span className="block w-1/5" />
                        <Price className="block w-1/5 color-hint" currency={'USD'}>
                            {toFiat(Number(totalAmount)).toFixed(2)}
                        </Price>
                        <BitcoinAmount className="block w-1/5" unit={BitcoinUnit.SATS}>
                            {Number(totalAmount)}
                        </BitcoinAmount>
                    </li>
                </ul>
            </div>

            <div className="pb-8 border-bottom">
                <Label className="mb-4 block">{c('Wallet Send').t`Note`}</Label>
                <TextAreaTwo
                    id="transaction-note"
                    className="mb-4"
                    value={note}
                    onValue={(note: string) => setNode(note)}
                    autoFocus
                    required
                />
            </div>

            <div className="my-3 flex w-full">
                <Button className="ml-auto" onClick={() => onBack()}>{c('Wallet Send').t`Back`}</Button>
                <Button color="norm" className="ml-3" onClick={() => onSignAndSend()}>{c('Wallet Send')
                    .t`Sign & Send`}</Button>
            </div>
        </Card>
    );
};
