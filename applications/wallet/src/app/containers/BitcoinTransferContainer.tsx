import { useState } from 'react';

import { c } from 'ttag';

import { Tabs } from '@proton/components/components';
import useSearchParams from '@proton/hooks/useSearchParams';

import { BitcoinReceiveInfoGenerator, OnchainTransactionBuilder } from '../components';

export const BitcoinTransferContainer = () => {
    const [params] = useSearchParams();

    const [tabIndex, setTabIndex] = useState(params.mode === 'send' ? 1 : 0);

    return (
        <div className="flex flex-column flex-item-grow p-8">
            <h2 className="text-semibold text-2xl mb-4">{c('Wallet Transfer').t`Transfer bitcoins`}</h2>

            <div className="w-full max-w-custom rounded overflow-hidden" style={{ '--max-w-custom': '40rem' }}>
                <Tabs
                    className="bg-weak w-full"
                    fullWidth
                    value={tabIndex}
                    onChange={setTabIndex}
                    tabs={[
                        {
                            title: c('Wallet Transfer').t`Receive bitcoins`,
                            content: <BitcoinReceiveInfoGenerator defaultWalletId={params.walletId} />,
                        },
                        {
                            title: c('Wallet Transfer').t`Send bitcoins`,
                            content: (
                                <div>
                                    {/* TODO: Put send method selection before. Will be done once design finished */}
                                    <OnchainTransactionBuilder defaultWalletId={params.walletId} />
                                </div>
                            ),
                        },
                    ]}
                />
            </div>
        </div>
    );
};
