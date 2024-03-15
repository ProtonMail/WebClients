import { c } from 'ttag';

import { WasmTxBuilder } from '@proton/andromeda';
import { Button } from '@proton/atoms/Button/Button';
import Card from '@proton/atoms/Card/Card';

import { TxBuilderUpdater } from '../../../hooks/useTxBuilder';
import { AccountWithChainData } from '../../../types';
import { OnchainTransactionAdvancedOptions } from './OnchainTransactionAdvancedOptions';

interface Props {
    txBuilder: WasmTxBuilder;
    account?: AccountWithChainData;
    updateTxBuilder: (updater: TxBuilderUpdater) => void;
    createPsbt: () => Promise<void>;
}

export const OnchainTransactionBuilderFooter = ({ txBuilder, account, updateTxBuilder, createPsbt }: Props) => {
    return (
        <Card
            className="flex flex-column transaction-builder-card bg-norm overflow-y-auto flex-nowrap"
            bordered={false}
            background={false}
            rounded
        >
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
