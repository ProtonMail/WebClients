import { c } from 'ttag';

import type { WasmAddressDetails, WasmApiWalletAccount } from '@proton/andromeda';
import { Copy, useNotifications } from '@proton/components';
import Icon from '@proton/components/components/icon/Icon';
import Tooltip from '@proton/components/components/tooltip/Tooltip';
import clsx from '@proton/utils/clsx';
import { useUserWalletSettings, useWalletAccountExchangeRate } from '@proton/wallet/store';

import { Price } from '../../../atoms/Price';
import { Skeleton } from '../../../atoms/Skeleton';
import { DataListItem } from '../../DataList';

export const IndexDataListItem = ({ address, loading }: { address?: WasmAddressDetails; loading?: boolean }) => {
    return (
        <DataListItem
            bottomNode={
                <Skeleton loading={loading}>
                    <div className="flex items-center">{`${address?.index}`}</div>
                </Skeleton>
            }
        />
    );
};

export const AddressDataListItem = ({
    address,
    highlighted,
    loading,
}: {
    address?: WasmAddressDetails;
    highlighted?: boolean;
    loading?: boolean;
}) => {
    return (
        <DataListItem
            bottomNode={
                <Skeleton loading={loading}>
                    <div className={clsx('block text-ellipsis text-monospace', highlighted && 'color-primary')}>
                        {address ? `${address.address}` : 'bc1qplaceholderplaceholderplaceholder'}
                        {highlighted && (
                            <Tooltip title={c('Info').t`This address is used to receive Bitcoin via Email`}>
                                <Icon name="brand-bitcoin" className="ml-2 color-hint" />
                            </Tooltip>
                        )}
                    </div>
                </Skeleton>
            }
        />
    );
};

export const AddressBalanceDataListItem = ({
    walletAccount,
    address,
    loading,
}: {
    walletAccount?: WasmApiWalletAccount;
    address?: WasmAddressDetails;
    loading?: boolean;
}) => {
    const [settings] = useUserWalletSettings();
    const [exchangeRate] = useWalletAccountExchangeRate(walletAccount);

    const value = address ? address.balance.confirmed + address.balance.trusted_pending : 0;

    return (
        <DataListItem
            bottomNode={
                <Skeleton loading={loading}>
                    <div className="flex items-center">
                        <Price
                            unit={exchangeRate ?? settings.BitcoinUnit}
                            amount={value}
                            withPositiveSign
                            signClassName={value < 0 ? 'color-danger' : 'color-success'}
                            wrapperClassName="items-baseline"
                        />
                    </div>
                </Skeleton>
            }
        />
    );
};

export const AddressStatusDataListItem = ({
    address,
    loading,
}: {
    address?: WasmAddressDetails;
    loading?: boolean;
}) => {
    return (
        <DataListItem
            bottomNode={
                <Skeleton loading={loading}>
                    {(() => {
                        if (address) {
                            const transactionsCount = address.transactions.length;

                            if (transactionsCount > 0) {
                                return <div className="flex items-center">{c('Address list').t`Used`}</div>;
                            }
                        }

                        return <div className="flex items-center">{c('Address list').t`Not used`}</div>;
                    })()}
                </Skeleton>
            }
        />
    );
};

export const CopyAddressDataListItem = ({
    address,
    loading,
}: {
    lastUsedIndex?: number;
    address?: WasmAddressDetails;
    loading?: boolean;
    isInPool?: boolean;
}) => {
    const { createNotification } = useNotifications();

    return (
        <DataListItem
            bottomNode={
                <Skeleton loading={loading}>
                    <Copy
                        value={address?.address ?? ''}
                        onCopy={() => {
                            createNotification({ text: c('Address list').t`Address copied` });
                        }}
                    />
                </Skeleton>
            }
        />
    );
};
