import { c } from 'ttag';

import type { WasmApiWalletAccount } from '@proton/andromeda';
import { WasmSortOrder } from '@proton/andromeda';
import { Icon, Tooltip } from '@proton/components';
import { type IWasmApiWalletData } from '@proton/wallet';

import { CoreButton } from '../../../atoms';
import { useTransactionContentHeader } from './useTransactionContentHeader';

interface Props {
    apiWalletData: IWasmApiWalletData;
    apiAccount?: WasmApiWalletAccount;
    sortOrder: WasmSortOrder;
    onSortChange: (order: WasmSortOrder) => void;
}

export const TransactionContentHeader = ({ apiWalletData, apiAccount, onSortChange, sortOrder }: Props) => {
    const {
        isCoolingDown,
        isSyncingWalletData,

        isNarrow,
        handleClickSync,
    } = useTransactionContentHeader({ walletId: apiWalletData.Wallet.ID, walletAccountId: apiAccount?.ID });

    return (
        <div className="flex flex-row">
            <Tooltip
                title={(() => {
                    if (isSyncingWalletData || isCoolingDown) {
                        return c('Wallet transactions list').t`Syncing in progress. Please wait`;
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
                onClick={() => onSortChange(sortOrder === WasmSortOrder.Asc ? WasmSortOrder.Desc : WasmSortOrder.Asc)}
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
    );
};
