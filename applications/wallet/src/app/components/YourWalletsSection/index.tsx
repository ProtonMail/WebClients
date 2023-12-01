import React from 'react';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button';
import { Card } from '@proton/atoms/Card';
import { Badge } from '@proton/components/components';

import { BitcoinAmount } from '../../atoms';
import { useBalanceDistribution } from '../../hooks/useBalanceDistribution';
import { BitcoinUnit, WalletWithAccountsWithBalanceAndTxs } from '../../types';
import { WalletType } from '../../types/api';

interface Props {
    wallets: WalletWithAccountsWithBalanceAndTxs[];
}

// TODO: change this when wallet settings API is ready
const fiatCurrency = 'USD';
const bitcoinUnit = BitcoinUnit.BTC;

export const YourWalletsSection = ({ wallets }: Props) => {
    const distribution = useBalanceDistribution(wallets);

    const lightningBalance = distribution[WalletType.Lightning];
    const onchainBalance = distribution[WalletType.OnChain];

    return (
        <div className="mt-14">
            <h2 className="h4 text-semibold">{c('Wallet Dashboard').t`Your wallets`}</h2>

            <div className="flex flex-row flex-justify-space-evenly">
                <Card
                    data-testid="lightning-balance-card"
                    rounded
                    className="light-gradient-card flex flex-column flex-align-items-end w-custom h-custom mr-6 mt-4"
                    style={{ '--w-custom': '16rem', '--h-custom': '8.5rem' }}
                >
                    <div className="flex flex-row flex-justify-space-between w-full mt-1">
                        <h3 className="text-lg">{c('Wallet Dashboard').t`Your checking`}</h3>
                        <Badge className="mr-0 mt-0.5" type="warning">
                            Lightning
                        </Badge>
                    </div>

                    <BitcoinAmount
                        unit={bitcoinUnit}
                        fiat={fiatCurrency}
                        className="mt-4 text-2xl"
                        fiatClassName="mb-1"
                    >
                        {lightningBalance ?? 0}
                    </BitcoinAmount>
                </Card>

                <Card
                    data-testid="onchain-balance-card"
                    rounded
                    className="light-gradient-card flex flex-column flex-align-items-end w-custom h-custom mr-6 mt-4"
                    style={{ '--w-custom': '16rem', '--h-custom': '8.5rem' }}
                >
                    <div className="flex flex-row flex-justify-space-between w-full mt-1">
                        <h3 className="text-lg">{c('Wallet Dashboard').t`Your saving`}</h3>
                        <Badge className="mr-0 mt-0.5" type="info">
                            OnChain
                        </Badge>
                    </div>

                    <BitcoinAmount
                        unit={bitcoinUnit}
                        fiat={fiatCurrency}
                        className="mt-4 text-2xl"
                        fiatClassName="mb-1"
                    >
                        {onchainBalance ?? 0}
                    </BitcoinAmount>
                </Card>

                <ButtonLike
                    rounded
                    className="light-gradient-card flex w-custom h-custom mr-6 mt-4"
                    style={{ '--w-custom': '16rem', '--h-custom': '8.5rem' }}
                    as={Card}
                    onClick={() => {
                        // TODO: open wallet setup modal here
                    }}
                >
                    <div className="m-auto color-primary text-2xl">Add wallet</div>
                </ButtonLike>
            </div>
        </div>
    );
};
