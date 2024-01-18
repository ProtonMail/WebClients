import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Card from '@proton/atoms/Card/Card';

import { WasmTxBuilder } from '../../../../pkg';
import { TxBuilderUpdater } from '../../../hooks/useTxBuilder';
import { AccountWithBlockchainData } from '../../../types';
import { OnChainFeesSelector } from './OnchainFeesSelector';
import { OnchainTransactionAdvancedOptions } from './OnchainTransactionAdvancedOptions';

interface Props {
    txBuilder: WasmTxBuilder;
    updateTxBuilder: (updater: TxBuilderUpdater) => void;
    createPsbt: () => Promise<void>;
    account?: AccountWithBlockchainData;
}

export const OnchainFeesAndOptionsCard = ({ txBuilder, updateTxBuilder, account, createPsbt }: Props) => {
    return (
        <Card
            className="flex flex-column transaction-builder-card bg-norm overflow-y-auto flex-nowrap"
            bordered={false}
            background={false}
            rounded
        >
            <OnChainFeesSelector txBuilder={txBuilder} updateTxBuilder={updateTxBuilder} />
            <hr className="my-2 bg-weak" />

            <OnchainTransactionAdvancedOptions
                txBuilder={txBuilder}
                updateTxBuilder={updateTxBuilder}
                account={account}
            />
            <hr className="my-2 bg-weak" />

            <Button
                color="norm"
                className="mt-4 ml-auto"
                onClick={() => {
                    void createPsbt();
                }}
            >
                {c('Wallet Send').t`Review transaction`}
            </Button>
        </Card>
    );
};
