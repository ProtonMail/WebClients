import { c } from 'ttag';

import type { WasmApiWalletAccount } from '@proton/andromeda';
import { WasmSortOrder } from '@proton/andromeda';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcArrowsRotate } from '@proton/icons/icons/IcArrowsRotate';
import { IcListArrowDown } from '@proton/icons/icons/IcListArrowDown';
import { IcListArrowUp } from '@proton/icons/icons/IcListArrowUp';
import type { IWasmApiWalletData } from '@proton/wallet/types';

import { CoreButton } from '../../../atoms';
import { ExportStatementButton } from '../../ExportStatementButton';
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

        hasTransaction,
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
                        <IcArrowsRotate size={isNarrow ? 4 : 5} alt={c('Wallet transactions list').t`Sync`} />
                    </CoreButton>
                </div>
            </Tooltip>
            <CoreButton
                icon
                size={isNarrow ? 'small' : 'medium'}
                shape="ghost"
                color="weak"
                className="ml-2 rounded-full bg-weak"
                disabled={isSyncingWalletData || !hasTransaction}
                onClick={() => onSortChange(sortOrder === WasmSortOrder.Asc ? WasmSortOrder.Desc : WasmSortOrder.Asc)}
            >
                {sortOrder === WasmSortOrder.Asc ? (
                    <IcListArrowDown alt={c('Wallet transactions list').t`Descending order`} size={isNarrow ? 4 : 5} />
                ) : (
                    <IcListArrowUp alt={c('Wallet transactions list').t`Ascending order`} size={isNarrow ? 4 : 5} />
                )}
            </CoreButton>
            <ExportStatementButton
                apiWalletData={apiWalletData}
                apiAccount={apiAccount}
                disabled={isSyncingWalletData || !hasTransaction}
            />
        </div>
    );
};
