import React, { useState } from 'react';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button';
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

                <div className="max-w-full overflow-auto">
                    <div className="flex flex-row flex-nowrap w-custom" style={{ '--w-custom': 'max-content' }}>
                        {wallet.accounts.map((account) => (
                            <Card
                                key={account.WalletAccountID}
                                data-testid="account-balance-card"
                                rounded
                                className="light-gradient-card flex flex-column w-custom h-custom mx-auto mt-4 py-3 mr-6"
                                style={{ '--w-custom': '16rem', '--h-custom': '8.5rem' }}
                            >
                                <div className="flex flex-column ml-auto mt-0 ">
                                    <BitcoinAmount
                                        unit={bitcoinUnit}
                                        fiat={fiatCurrency}
                                        className="text-2xl"
                                        fiatClassName="ml-auto mb-1"
                                    >
                                        {account.balance.confirmed ? Number(account.balance.confirmed) : 0}
                                    </BitcoinAmount>
                                </div>

                                <div className="mt-auto flex flex-column">
                                    <span className="color-hint text-sm">
                                        {getLabelByScriptType(account.ScriptType)}
                                    </span>
                                    <h3 className="text-lg">{account.Label}</h3>
                                </div>
                            </Card>
                        ))}

                        <ButtonLike
                            rounded
                            className="light-gradient-card flex w-custom h-custom mx-auto mt-4"
                            style={{ '--w-custom': '16rem', '--h-custom': '8.5rem' }}
                            as={Card}
                            onClick={() => {
                                setIsAddWalletModalOpenned(true);
                            }}
                        >
                            <div className="m-auto color-primary text-2xl">{c('Wallet Dashboard').t`Add Account`}</div>
                        </ButtonLike>
                    </div>
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
