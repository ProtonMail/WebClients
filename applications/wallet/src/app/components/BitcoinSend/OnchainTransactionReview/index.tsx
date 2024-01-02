import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Card from '@proton/atoms/Card/Card';

import { WasmAccount, WasmDetailledTransaction, WasmPartiallySignedTransaction } from '../../../../pkg';
import { OnchainTransactionDetails } from '../../OnchainTransactionDetails';

interface Props {
    from: { walletName: string; accountName: string };
    account: WasmAccount;
    psbt: WasmPartiallySignedTransaction;
    onBack: () => void;
    onSignAndSend: () => void;
}

export const OnchainTransactionReview = ({ from, account, psbt, onBack, onSignAndSend }: Props) => {
    const [tx, setTx] = useState<WasmDetailledTransaction>();

    useEffect(() => {
        void WasmDetailledTransaction.fromPsbt(psbt, account).then((tx) => setTx(tx));
    }, [account, psbt]);

    return (
        <Card
            className="flex flex-column transaction-builder-card bg-norm flex-1 overflow-y-auto flex-nowrap mx-4"
            bordered={false}
            background={false}
            rounded
        >
            {tx && (
                <>
                    <OnchainTransactionDetails from={from} account={account} tx={tx} />
                    <div className="my-3 flex w-full">
                        <Button className="ml-auto" onClick={() => onBack()}>{c('Wallet Send').t`Back`}</Button>
                        <Button color="norm" className="ml-3" onClick={() => onSignAndSend()}>{c('Wallet Send')
                            .t`Sign & Send`}</Button>
                    </div>
                </>
            )}
        </Card>
    );
};
