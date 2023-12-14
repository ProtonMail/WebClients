import { useState } from 'react';

import { c } from 'ttag';

import { Tabs } from '@proton/components/components';
import useSearchParams from '@proton/hooks/useSearchParams';

import { BitcoinReceiveInfoGenerator, OnchainTransactionBuilder } from '../components';
import { WalletWithAccountsWithBalanceAndTxs } from '../types';

interface Props {
    wallets: WalletWithAccountsWithBalanceAndTxs[];
}

export const BitcoinTransferContainer = ({ wallets }: Props) => {
    const [params] = useSearchParams();

    const [tabIndex, setTabIndex] = useState(params.mode === 'send' ? 1 : 0);

    return (
        <div className="flex flex-column grow p-8">
            <h2 className="text-semibold text-2xl mb-4">{c('Wallet Transfer').t`Transfer bitcoins`}</h2>

            <div
                className="w-full max-w-custom rounded overflow-hidden flex flex-column grow"
                style={{ '--max-w-custom': '40rem' }}
            >
                <Tabs
                    className="w-full flex flex-column grow pb-4"
                    fullWidth
                    value={tabIndex}
                    onChange={setTabIndex}
                    variant="modern"
                    contentClassName="grow"
                    tabs={[
                        {
                            title: c('Wallet Transfer').t`Receive bitcoins`,
                            content: (
                                <BitcoinReceiveInfoGenerator
                                    wallets={wallets}
                                    defaultWalletId={Number(params.walletId)}
                                />
                            ),
                        },
                        {
                            title: c('Wallet Transfer').t`Send bitcoins`,
                            content: (
                                <>
                                    {/* TODO: Put send method selection before. Will be done once design finished */}
                                    <OnchainTransactionBuilder
                                        wallets={wallets}
                                        defaultWalletId={Number(params.walletId)}
                                    />
                                </>
                            ),
                        },
                    ]}
                />
            </div>
        </div>
    );
};
