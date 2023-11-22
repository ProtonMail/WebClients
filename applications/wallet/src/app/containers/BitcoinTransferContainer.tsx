import { useState } from 'react';

import { c } from 'ttag';

import { Tabs } from '@proton/components/components';

import { BitcoinReceiveInfoGenerator } from '../components';

export const BitcoinTransferContainer = () => {
    const [tabIndex, setTabIndex] = useState(0);

    return (
        <div className="flex flex-column flex-item-grow">
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
                            content: <BitcoinReceiveInfoGenerator />,
                        },
                        {
                            title: c('Wallet Transfer').t`Send bitcoins`,
                            content: <div>{/* This will be done with Bitcoin Send ticket */}</div>,
                        },
                    ]}
                />
            </div>
        </div>
    );
};
