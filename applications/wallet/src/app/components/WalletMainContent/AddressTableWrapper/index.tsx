import { type ChangeEvent, type ReactNode } from 'react';

import { c } from 'ttag';

import { type WasmApiWalletAccount, WasmKeychainKind } from '@proton/andromeda';
import { Input } from '@proton/atoms';
import { Icon } from '@proton/components';
import clsx from '@proton/utils/clsx';
import { type IWasmApiWalletData } from '@proton/wallet';

import { Button, CoreButton } from '../../../atoms';
import { useResponsiveContainerContext } from '../../../contexts/ResponsiveContainerContext';
import { AddressTable } from '../AddressTable';
import { useAddressTable } from './useAddressTable';

interface Props {
    selectorOrTitle: ReactNode;
    apiWalletData: IWasmApiWalletData;
    apiAccount: WasmApiWalletAccount;
}

export const AddressTableWrapper = ({ selectorOrTitle, apiWalletData, apiAccount }: Props) => {
    const { isNarrow } = useResponsiveContainerContext();

    const {
        addresses,
        loading,
        bitcoinAddressPool,

        keychain,
        toggleKeychain,

        addressSearch,
        setAddressSearch,

        currentPage,
        handleNext,
        handlePrev,
        sync,

        account,
    } = useAddressTable({
        wallet: apiWalletData,
        walletAccount: apiAccount,
    });

    return (
        <>
            <div className={clsx('flex flex-column grow', isNarrow && 'bg-weak rounded-xl mx-2')}>
                <div
                    className={clsx(
                        'flex flex-row px-4 items-center justify-space-between',
                        isNarrow ? 'mt-6 mb-3 color-weak' : 'mt-10 mb-6'
                    )}
                >
                    <div className="flex flex-row items-center flex-nowrap grow">
                        {selectorOrTitle}

                        <div className="ml-5 flex flex-row items-center flex-nowrap grow">
                            <label htmlFor="address-search-input" className="sr-only">{c('Address list')
                                .t`Search exact address`}</label>
                            <Input
                                id="address-search-input"
                                placeholder={c('Address list').t`Search for exact address`}
                                value={addressSearch}
                                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                    setAddressSearch(e.target.value);
                                }}
                                className={'rounded-md'}
                            />
                        </div>
                    </div>

                    <div>
                        {isNarrow ? (
                            <CoreButton
                                icon
                                size="small"
                                shape="ghost"
                                color="weak"
                                className="ml-2 rounded-full bg-weak"
                                disabled={loading}
                                onClick={() => sync(true)}
                            >
                                <Icon name="arrows-switch" size={4} alt={c('Address list').t`Toggle keychain`} />
                            </CoreButton>
                        ) : (
                            <Button
                                size="small"
                                shape="ghost"
                                color="norm"
                                className="ml-2 rounded-full bg-weak"
                                disabled={loading}
                                onClick={() => toggleKeychain()}
                            >
                                {keychain === WasmKeychainKind.External
                                    ? c('Wallet header').t`View change addresses`
                                    : c('Wallet header').t`View receive addresses`}
                                <Icon
                                    name="arrows-switch"
                                    className="ml-2"
                                    alt={c('Address list').t`Toggle keychain`}
                                />
                            </Button>
                        )}
                    </div>
                </div>

                <div className="flex flex-column w-full grow flex-nowrap grow">
                    <AddressTable
                        account={account}
                        apiAccount={apiAccount}
                        addresses={addresses}
                        loading={loading}
                        bitcoinAddressPool={bitcoinAddressPool}
                        currentPage={currentPage}
                        handleNext={handleNext}
                        handlePrev={handlePrev}
                        keychain={keychain}
                    />
                </div>
            </div>
        </>
    );
};
