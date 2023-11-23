import React from 'react';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button';
import { Card } from '@proton/atoms/Card';
import { Badge } from '@proton/components/components';

import { BitcoinAmount } from '../../atoms';
import { useBalanceDistribution } from '../../hooks/useBalanceDistribution';
import { BitcoinUnit, Wallet } from '../../types';

interface Props {
    wallets: Wallet[];
}

// TODO: change this when wallet settings API is ready
const fiatCurrency = 'USD';
const bitcoinUnit = BitcoinUnit.BTC;

export const YourWalletsSection = ({ wallets }: Props) => {
    const { LIGHTNING: lightningBalance, ONCHAIN: onchainBalance } = useBalanceDistribution(wallets);

    return (
        <div className="mt-14">
            <h2 className="h3 text-semibold">{c('Wallet Dashboard').t`Your wallets`}</h2>

            <div className="flex flex-row mt-4">
                <Card
                    data-testid="lightning-balance-card"
                    rounded
                    className="light-gradient-card flex flex-column flex-align-items-end flex-item-grow max-w-custom mr-6"
                    style={{ '--max-w-custom': '18rem' }}
                >
                    <div className="flex flex-row flex-justify-space-between w-full mt-1">
                        <h3 className="text-xl">{c('Wallet Dashboard').t`Your Checking`}</h3>
                        <Badge className="mr-0 mt-0.5" type="warning">
                            Lightning
                        </Badge>
                    </div>

                    <BitcoinAmount
                        unit={bitcoinUnit}
                        fiat={fiatCurrency}
                        className="mt-4 text-3xl"
                        fiatClassName="mb-1"
                    >
                        {lightningBalance ?? 0}
                    </BitcoinAmount>
                </Card>

                <Card
                    data-testid="onchain-balance-card"
                    rounded
                    className="light-gradient-card flex flex-column flex-align-items-end flex-item-grow max-w-custom mr-6"
                    style={{ '--max-w-custom': '18rem' }}
                >
                    <div className="flex flex-row flex-justify-space-between w-full mt-1">
                        <h3 className="text-xl">{c('Wallet Dashboard').t`Your Saving`}</h3>
                        <Badge className="mr-0 mt-0.5" type="info">
                            OnChain
                        </Badge>
                    </div>

                    <BitcoinAmount
                        unit={bitcoinUnit}
                        fiat={fiatCurrency}
                        className="mt-4 text-3xl"
                        fiatClassName="mb-1"
                    >
                        {onchainBalance ?? 0}
                    </BitcoinAmount>
                </Card>

                <ButtonLike
                    rounded
                    className="light-gradient-card flex flex-item-grow max-w-custom mr-6"
                    style={{ '--max-w-custom': '18rem' }}
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
