import { type ReactNode, useState } from 'react';

import { type WasmApiWalletAccount, WasmSortOrder } from '@proton/andromeda';
import clsx from '@proton/utils/clsx';
import { type IWasmApiWalletData } from '@proton/wallet';

import { useResponsiveContainerContext } from '../../../contexts/ResponsiveContainerContext';
import { TransactionContentHeader } from '../TransactionContentHeader';
import { TransactionTable } from '../TransactionTable';

interface Props {
    selectorOrTitle: ReactNode;
    apiWalletData: IWasmApiWalletData;
    apiAccount?: WasmApiWalletAccount;
    onClickReceive: () => void;
    onClickBuy: () => void;
}

export const TransactionTableWrapper = ({
    selectorOrTitle,
    apiWalletData,
    apiAccount,
    onClickReceive,
    onClickBuy,
}: Props) => {
    const { isNarrow } = useResponsiveContainerContext();
    const [sortOrder, setSortOrder] = useState<WasmSortOrder>(WasmSortOrder.Desc);

    return (
        <div className={clsx('flex flex-column grow', isNarrow && 'bg-weak rounded-xl mx-2')}>
            <div
                className={clsx(
                    'flex flex-row px-4 items-center justify-space-between h-custom',
                    isNarrow ? 'mt-6 mb-3 color-weak' : 'mt-10 mb-6'
                )}
                style={{ '--h-custom': '2.5rem' }}
            >
                {selectorOrTitle}

                <TransactionContentHeader
                    apiWalletData={apiWalletData}
                    apiAccount={apiAccount}
                    sortOrder={sortOrder}
                    onSortChange={(order: WasmSortOrder) => {
                        setSortOrder(order);
                    }}
                />
            </div>

            <div className="flex flex-column w-full grow flex-nowrap grow">
                <TransactionTable
                    wallet={apiWalletData}
                    walletAccountId={apiAccount?.ID}
                    sortOrder={sortOrder}
                    onClickBuy={onClickBuy}
                    onClickReceive={onClickReceive}
                />
            </div>
        </div>
    );
};
