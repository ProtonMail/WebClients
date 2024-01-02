import React, { useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { Option, SelectTwo } from '@proton/components/components';
import useSearchParams from '@proton/hooks/useSearchParams';

import { TransactionList } from '../components/TransactionList';
import { useBlockchainContext } from '../contexts';

export const TransactionHistoryContainer = () => {
    const [params] = useSearchParams();
    const { wallets } = useBlockchainContext();
    const [walletId, setWalletId] = useState<number>();

    useEffect(() => {
        if (params.walletId) {
            setWalletId(Number(params.walletId));
        } else {
            setWalletId(wallets?.[0]?.WalletID);
        }
    }, [params.walletId, wallets]);

    const wallet = useMemo(() => wallets?.find(({ WalletID }) => WalletID === Number(walletId)), [walletId, wallets]);

    if (!wallet) {
        return null;
    }

    return (
        <>
            <div className="p-8 flex flex-column w-full h-full flex-nowrap">
                <div className="flex flex-row justify-space-between items-center shrink-0">
                    <h2 className="h4 text-semibold my-3">{c('Wallet Transaction List').t`Transactions`}</h2>

                    <div className="flex flex-row shrink-0 items-center justify-center">
                        <label className="mr-4" htmlFor="wallet-selector" id="label-wallet-selector">
                            {c('Wallet Settings').t`Wallet`}
                        </label>

                        <div>
                            <SelectTwo
                                id="wallet-selector"
                                aria-describedby="label-wallet-selector"
                                value={walletId}
                                onChange={(event) => {
                                    setWalletId(event.value);
                                }}
                            >
                                {wallets
                                    ? [
                                          <Option key="-" value="-" title="All" disabled />,
                                          ...wallets?.map((wallet) => (
                                              <Option
                                                  key={wallet.WalletID}
                                                  value={wallet.WalletID}
                                                  title={wallet.Name}
                                              />
                                          )),
                                      ]
                                    : []}
                            </SelectTwo>
                        </div>
                    </div>
                </div>

                {wallet && <TransactionList wallet={wallet} />}
            </div>
        </>
    );
};
