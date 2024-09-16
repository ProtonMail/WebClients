import { c } from 'ttag';

import type { WasmApiWalletAccount } from '@proton/andromeda';
import { WasmSortOrder } from '@proton/andromeda';
import { Icon, Tooltip } from '@proton/components';
import clsx from '@proton/utils/clsx';
import type { IWasmApiWalletData } from '@proton/wallet';

import { CoreButton } from '../../atoms';
import { TransactionTable } from './TransactionTable';
import { useTransactionList } from './useTransactionList';

interface Props {
    apiWalletData: IWasmApiWalletData;
    apiAccount?: WasmApiWalletAccount;
    onClickReceive: () => void;
    onClickBuy: () => void;
}

export const TransactionList = ({ apiWalletData, apiAccount, onClickReceive, onClickBuy }: Props) => {
    const {
        isCoolingDown,
        isSyncingWalletData,

        sortOrder,
        setSortOrder,

        isNarrow,
        handleClickSync,
    } = useTransactionList({ walletId: apiWalletData.Wallet.ID, walletAccountId: apiAccount?.ID });

    return (
        <>
            <div className={clsx('flex flex-column grow', isNarrow && 'bg-weak rounded-xl mx-2')}>
                <div
                    className={clsx(
                        'flex flex-row px-4 items-center justify-space-between',
                        isNarrow ? 'mt-6 mb-3 color-weak' : 'mt-10 mb-6'
                    )}
                >
                    <h2 className={clsx('mr-4 text-semibold', isNarrow ? 'text-lg' : 'text-4xl')}>{c(
                        'Wallet transactions'
                    ).t`Transactions`}</h2>

                    <div className="flex flex-row">
                        <Tooltip
                            title={(() => {
                                if (isSyncingWalletData) {
                                    return c('Wallet transactions list').t`Syncing is already in progress`;
                                } else if (isCoolingDown) {
                                    return c('Wallet transactions list').t`You need to wait 1 minute between each sync`;
                                } else {
                                    return undefined;
                                }
                            })()}
                        >
                            <div>
                                <CoreButton
                                    icon
                                    size={isNarrow ? 'small' : 'medium'}
                                    shape="ghost"
                                    color="weak"
                                    className="ml-2 rounded-full bg-weak"
                                    disabled={isSyncingWalletData || isCoolingDown}
                                    onClick={() => handleClickSync()}
                                >
                                    <Icon
                                        name="arrows-rotate"
                                        size={isNarrow ? 4 : 5}
                                        alt={c('Wallet transactions list').t`Sync`}
                                    />
                                </CoreButton>
                            </div>
                        </Tooltip>
                        <CoreButton
                            icon
                            size={isNarrow ? 'small' : 'medium'}
                            shape="ghost"
                            color="weak"
                            className="ml-2 rounded-full bg-weak"
                            disabled={isSyncingWalletData}
                            onClick={() =>
                                setSortOrder((prev) =>
                                    prev === WasmSortOrder.Asc ? WasmSortOrder.Desc : WasmSortOrder.Asc
                                )
                            }
                        >
                            {sortOrder === WasmSortOrder.Asc ? (
                                <Icon
                                    alt={c('Wallet transactions list').t`Descending order`}
                                    name="list-arrow-down"
                                    size={isNarrow ? 4 : 5}
                                />
                            ) : (
                                <Icon
                                    alt={c('Wallet transactions list').t`Ascending order`}
                                    name="list-arrow-up"
                                    size={isNarrow ? 4 : 5}
                                />
                            )}
                        </CoreButton>
                    </div>
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
        </>
    );
};
