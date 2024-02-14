import React, { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Card } from '@proton/atoms/Card';

import { WasmBitcoinUnit } from '../../../pkg';
import { BitcoinAmount } from '../../atoms';
import { WalletWithAccountsWithBalanceAndTxs } from '../../types';
import { getLabelByScriptType } from '../../utils';
import { AddAccountModal } from '../AddAccountModal';

interface Props {
    wallet: WalletWithAccountsWithBalanceAndTxs;
}

// TODO: change this when wallet settings API is ready
const fiatCurrency = 'USD';
const bitcoinUnit = WasmBitcoinUnit.BTC;

export const YourAccountsSection = ({ wallet }: Props) => {
    const [isAddWalletModalOpenned, setIsAddWalletModalOpenned] = useState(false);

    return (
        <>
            <div className="mt-14">
                <h2 className="h4 text-semibold">{c('Wallet Dashboard').t`Your accounts`}</h2>

                <div className="grid-auto-fill mt-4 gap-4" style={{ '--min-grid-template-column-size': '16rem' }}>
                    {wallet.accounts.map((account) => (
                        <Card
                            key={account.WalletAccountID}
                            data-testid="account-balance-card"
                            rounded
                            className="w-full bg-gradient-weak-norm border-weak py-3"
                        >
                            <div className="text-right">
                                <BitcoinAmount
                                    bitcoin={account.balance.confirmed ? Number(account.balance.confirmed) : 0}
                                    unit={bitcoinUnit}
                                    fiat={fiatCurrency}
                                    firstClassName="text-2xl"
                                />
                            </div>

                            <div className="mt-4">
                                <span className="color-hint text-sm">{getLabelByScriptType(account.ScriptType)}</span>
                                <h3 className="text-lg">{account.Label}</h3>
                            </div>
                        </Card>
                    ))}

                    <Button
                        shape="outline"
                        color="weak"
                        fullWidth
                        className="border-weak flex"
                        onClick={() => {
                            setIsAddWalletModalOpenned(true);
                        }}
                    >
                        <div className="m-auto color-primary">{c('Wallet Dashboard').t`Add Account`}</div>
                    </Button>
                </div>
            </div>

            <AddAccountModal
                isOpen={isAddWalletModalOpenned}
                onClose={() => {
                    setIsAddWalletModalOpenned(false);
                }}
            />
        </>
    );
};
