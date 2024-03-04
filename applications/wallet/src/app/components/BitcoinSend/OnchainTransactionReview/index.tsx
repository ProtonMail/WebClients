import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { WasmPartiallySignedTransaction, WasmTransactionDetails } from '@proton/andromeda';
import { Button } from '@proton/atoms/Button/Button';
import Card from '@proton/atoms/Card/Card';

import { useBitcoinBlockchainContext } from '../../../contexts';
import { AccountWithChainData } from '../../../types';
import { OnchainTransactionDetails } from '../../OnchainTransactionDetails';

interface Props {
    from: { walletName: string; accountName: string };
    account?: AccountWithChainData;
    psbt: WasmPartiallySignedTransaction;
    onBack: () => void;
    onSignAndSend: () => void;
}

export const OnchainTransactionReview = ({ from, account, psbt, onBack, onSignAndSend }: Props) => {
    const { walletsChainData } = useBitcoinBlockchainContext();
    const [tx, setTx] = useState<WasmTransactionDetails>();

    useEffect(() => {
        if (account) {
            void WasmTransactionDetails.fromPsbt(psbt, account.account).then((tx) => setTx(tx));
        }
    }, [psbt, account, walletsChainData]);

    return (
        <Card
            className="flex flex-column transaction-builder-card bg-norm flex-1 overflow-y-auto flex-nowrap mx-4"
            bordered={false}
            background={false}
            rounded
        >
            {tx && (
                <>
                    <OnchainTransactionDetails from={from} tx={tx} />

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
