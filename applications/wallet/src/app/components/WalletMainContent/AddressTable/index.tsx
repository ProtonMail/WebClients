import compact from 'lodash/compact';
import isUndefined from 'lodash/isUndefined';
import { c } from 'ttag';

import type { WasmAddressDetailsData, WasmApiWalletAccount, WasmApiWalletBitcoinAddress } from '@proton/andromeda';
import { WasmKeychainKind } from '@proton/andromeda';
import clsx from '@proton/utils/clsx';

import { SimplePaginator } from '../../../atoms';
import { BLOCKCHAIN_EXPLORER_BASE_URL_BY_NETWORK, ITEMS_PER_PAGE } from '../../../constants';
import { useBitcoinBlockchainContext } from '../../../contexts';
import { useResponsiveContainerContext } from '../../../contexts/ResponsiveContainerContext';
import type { DataColumn } from '../../DataList';
import { DataList } from '../../DataList';
import {
    AddressBalanceDataListItem,
    AddressDataListItem,
    AddressStatusDataListItem,
    CopyAddressDataListItem,
    IndexDataListItem,
} from './data-list-items';

interface Props {
    apiAccount: WasmApiWalletAccount;
    addresses: WasmAddressDetailsData[];
    loading: boolean;
    bitcoinAddressPool?: WasmApiWalletBitcoinAddress[];
    currentPage: number;
    handleNext: () => void;
    handlePrev: () => void;
    keychain?: WasmKeychainKind;
}

const getDummyLoadingColumns = (keychain: WasmKeychainKind): DataColumn<null>[] => {
    return compact([
        {
            header: <div>{c('Address list').t`Index`}</div>,
            id: 'index',
            colSpan: '5rem',
            className: 'flex flex-column items-center',
            data: () => <IndexDataListItem loading />,
        },
        {
            header: (
                <div>
                    {keychain === WasmKeychainKind.External
                        ? c('Address list').t`Receive address`
                        : c('Address list').t`Change address`}
                </div>
            ),
            id: 'address',
            colSpan: '1fr',
            data: () => <AddressDataListItem loading />,
        },
        {
            header: <div>{c('Address list').t`Value`}</div>,
            id: 'balance',
            colSpan: '10rem',
            data: () => <AddressBalanceDataListItem loading />,
        },
        {
            header: <div>{c('Address list').t`Status`}</div>,
            id: 'status',
            colSpan: '8rem',
            data: () => <AddressStatusDataListItem loading />,
        },
        {
            id: 'action',
            colSpan: '5rem',
            data: () => <CopyAddressDataListItem loading />,
        },
    ]);
};

export const AddressTable = ({
    apiAccount,
    addresses,
    loading,
    bitcoinAddressPool,
    currentPage,
    handleNext,
    handlePrev,
    keychain = WasmKeychainKind.External,
}: Props) => {
    const { isNarrow } = useResponsiveContainerContext();
    const { network } = useBitcoinBlockchainContext();

    if (loading) {
        return (
            <div className="flex flex-column grow flex-nowrap mb-2 grow overflow-auto">
                <div
                    className={clsx(
                        'relative flex flex-column bg-weak rounded-2xl overflow-hidden',
                        !isNarrow && 'mx-4'
                    )}
                >
                    <DataList
                        rows={new Array(ITEMS_PER_PAGE).fill({})}
                        columns={getDummyLoadingColumns(keychain)}
                        canClickRow={(address) => !!address}
                    />
                </div>
            </div>
        );
    }

    const pageNumber = currentPage + 1;

    const columns: DataColumn<{
        key: string;
        address: WasmAddressDetailsData;
    }>[] = compact([
        {
            header: <div>{c('Address list').t`Index`}</div>,
            id: 'index',
            colSpan: '5rem',
            className: 'flex flex-column items-center',
            data: (row) => <IndexDataListItem address={row.address.Data} />,
        },
        {
            header: (
                <div>
                    {keychain === WasmKeychainKind.External
                        ? c('Address list').t`Receive address`
                        : c('Address list').t`Change address`}
                </div>
            ),
            id: 'address',
            colSpan: '1fr',
            data: (row) => (
                <AddressDataListItem
                    address={row.address.Data}
                    highlighted={bitcoinAddressPool?.some(
                        (poolAddress) => poolAddress.BitcoinAddress === row.address.Data.address
                    )}
                />
            ),
        },
        {
            header: <div>{c('Address list').t`Value`}</div>,
            id: 'balance',
            colSpan: '10rem',
            data: (row) => <AddressBalanceDataListItem walletAccount={apiAccount} address={row.address.Data} />,
        },
        {
            header: <div>{c('Address list').t`Status`}</div>,
            id: 'status',
            colSpan: '8rem',
            data: (row) => (
                <AddressStatusDataListItem
                    keychain={keychain}
                    lastUsedIndex={apiAccount.LastUsedIndex}
                    address={row.address.Data}
                    addressPool={bitcoinAddressPool}
                />
            ),
        },
        {
            id: 'action',
            colSpan: '5rem',
            className: 'flex flex-column items-center',
            data: (row) => <CopyAddressDataListItem address={row.address.Data} />,
        },
    ]);

    const url = !isUndefined(network) && BLOCKCHAIN_EXPLORER_BASE_URL_BY_NETWORK[network];

    const openInBlockchainExplorer = (address: string) => {
        window.open(`${url}/address/${address}`, '_blank');
    };

    return (
        <>
            <div className="flex flex-column grow flex-nowrap mb-2 grow overflow-auto">
                <div
                    className={clsx(
                        'relative flex flex-column bg-weak rounded-2xl overflow-hidden',
                        !isNarrow && 'mx-4'
                    )}
                >
                    <DataList
                        rows={addresses.map((address) => ({ key: address.Data.address, address }))}
                        columns={columns}
                        canClickRow={(address) => !!(url && address)}
                        onClickRow={(address) => openInBlockchainExplorer(address.address.Data.address)}
                    />
                </div>
            </div>

            <div className="flex flex-row mt-auto shrink-0 justify-end items-center pr-4">
                <span className="block mr-4">{c('Address list').t`Page ${pageNumber}`}</span>
                <SimplePaginator canGoPrev={currentPage > 0} onNext={handleNext} canGoNext onPrev={handlePrev} />
            </div>
        </>
    );
};
