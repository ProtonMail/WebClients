import React from 'react';

import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms/Button';
import { Card } from '@proton/atoms/Card';
import { Pill } from '@proton/atoms/Pill';

import { WasmBitcoinUnit } from '../../../pkg';
import { BitcoinAmount } from '../../atoms';
import { useOnchainWalletContext } from '../../contexts';
import { useBalanceDistribution } from '../../hooks/useBalanceDistribution';
import { WalletType } from '../../types/api';

interface Props {
    onAddWallet: () => void;
}

// TODO: change this when wallet settings API is ready
const fiatCurrency = 'USD';
const bitcoinUnit = WasmBitcoinUnit.BTC;

export const YourWalletsSection = ({ onAddWallet }: Props) => {
    const { wallets } = useOnchainWalletContext();
    const distribution = useBalanceDistribution(wallets);

    const lightningBalance = distribution[WalletType.Lightning];
    const onchainBalance = distribution[WalletType.OnChain];

    return (
        <div className="mt-14">
            <h2 className="h4 text-semibold">{c('Wallet Dashboard').t`Your wallets`}</h2>

            <div className="flex flex-row justify-space-evenly">
                <Card
                    data-testid="lightning-balance-card"
                    rounded
                    className="light-gradient-card flex flex-column align-items-end w-custom mr-6 mt-4 py-3"
                    style={{ '--w-custom': '16rem' }}
                >
                    <div className="flex flex-row justify-space-between w-full">
                        <h3 className="text-lg">{c('Wallet Dashboard').t`Your checking`}</h3>
                        <Pill color="#AD7406">Lightning</Pill>
                    </div>

                    <BitcoinAmount
                        unit={bitcoinUnit}
                        fiat={fiatCurrency}
                        className="mt-auto text-2xl"
                        fiatClassName="mb-1"
                    >
                        {lightningBalance ?? 0}
                    </BitcoinAmount>
                </Card>

                <Card
                    data-testid="onchain-balance-card"
                    rounded
                    className="light-gradient-card flex flex-column align-items-end w-custom mr-6 mt-4 py-3"
                    style={{ '--w-custom': '16rem' }}
                >
                    <div className="flex flex-row justify-space-between w-full">
                        <h3 className="text-lg">{c('Wallet Dashboard').t`Your saving`}</h3>
                        <Pill color="#12869F">OnChain</Pill>
                    </div>

                    <BitcoinAmount
                        unit={bitcoinUnit}
                        fiat={fiatCurrency}
                        className="mt-auto text-2xl"
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
                        onAddWallet();
                    }}
                >
                    <div className="m-auto color-primary text-2xl">{c('Wallet Dashboard').t`Add wallet`}</div>
                </ButtonLike>
            </div>
        </div>
    );
};
