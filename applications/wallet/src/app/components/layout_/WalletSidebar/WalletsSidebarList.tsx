import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import {
    Icon,
    SidebarListItem,
    SidebarListItemButton,
    SidebarListItemContent,
    SidebarListItemContentIcon,
    SidebarListItemLink,
    useToggle,
} from '@proton/components';
import clsx from '@proton/utils/clsx';
import { IWasmApiWalletData } from '@proton/wallet';

import { CoreButton } from '../../../atoms';
import { getThemeByIndex } from '../../../utils';
import { WalletExpandButton } from './WalletExpandButton';

import './WalletsSidebarList.scss';

interface WalletsSidebarListItemProps {
    wallet: IWasmApiWalletData;
    onAddWalletAccount: () => void;
}

const WalletsSidebarListItem = ({ wallet, onAddWalletAccount }: WalletsSidebarListItemProps) => {
    const { state: showAccounts, toggle: toggleShowAccounts, set } = useToggle(false);

    const { pathname } = useLocation();

    useEffect(() => {
        set(pathname.includes(`/wallets/${wallet.Wallet.ID}`));
    }, [pathname, wallet.Wallet.ID, set]);

    return (
        <>
            <div className="sidebar-wallet-link-container rounded-none px-3">
                <SidebarListItemLink
                    to={`/wallets/${wallet.Wallet.ID}`}
                    exact
                    onClick={(e) => {
                        if (wallet.IsNotDecryptable) {
                            e.preventDefault();
                            e.stopPropagation();
                        }
                    }}
                    className={clsx(wallet.IsNotDecryptable ? 'disabled-sidebar-link' : '')}
                >
                    <SidebarListItemContent
                        data-testid="wallet-sidebar:wallet-item"
                        left={<SidebarListItemContentIcon className="wallet-icon" name={'wallet'} />}
                        className="sidebar-item-content flex gap-2 w-full"
                    >
                        <div className="ml-1 flex flex-row flex-nowrap justify-space-between items-center w-full relative">
                            <div className="block text-ellipsis" title={wallet.Wallet.Name}>
                                {wallet.Wallet.Name}
                            </div>

                            <WalletExpandButton expanded={showAccounts} onClick={() => toggleShowAccounts()} />
                        </div>
                    </SidebarListItemContent>
                </SidebarListItemLink>
            </div>

            {showAccounts && !wallet.IsNotDecryptable && (
                <ul className="unstyled">
                    {wallet.WalletAccounts.map((account) => {
                        return (
                            <SidebarListItem key={account.ID} className="wallet-account-list-item mt-1 px-5">
                                <SidebarListItemLink exact to={`/wallets/${wallet.Wallet.ID}/accounts/${account.ID}`}>
                                    <SidebarListItemContent
                                        data-testid="wallet-sidebar:wallet-account-item"
                                        left={<SidebarListItemContentIcon name="brand-bitcoin" />}
                                        className="sidebar-item-content flex gap-2 w-full"
                                    >
                                        <div className="ml-1 flex flex-row flex-nowrap justify-space-between items-center w-full relative">
                                            <div className="block text-ellipsis" title={account.Label}>
                                                {account.Label}
                                            </div>
                                        </div>
                                    </SidebarListItemContent>
                                </SidebarListItemLink>
                            </SidebarListItem>
                        );
                    })}
                    <SidebarListItem key="add-account" className="wallet-account-list-item mt-1 px-5">
                        <SidebarListItemButton onClick={() => onAddWalletAccount()}>
                            <SidebarListItemContent
                                data-testid="wallet-sidebar:add-wallet-account-item"
                                left={<SidebarListItemContentIcon className="color-hint" name="plus-circle" />}
                                className="sidebar-item-content flex gap-2 w-full"
                            >
                                <div
                                    className="ml-1 flex flex-row flex-nowrap justify-space-between items-center w-full relative color-hint"
                                    title={'Add account'}
                                >
                                    {'Add account'}
                                </div>
                            </SidebarListItemContent>
                        </SidebarListItemButton>
                    </SidebarListItem>
                </ul>
            )}
        </>
    );
};

interface WalletsSidebarListProps {
    loadingApiWalletsData: boolean;
    apiWalletsData?: IWasmApiWalletData[];
    onAddWallet: () => void;
    onAddWalletAccount: (apiWalletData: IWasmApiWalletData) => void;
}

export const WalletsSidebarList = ({
    loadingApiWalletsData,
    apiWalletsData,
    onAddWallet,
    onAddWalletAccount,
}: WalletsSidebarListProps) => {
    return (
        <SidebarListItem className="shrink overflow-auto">
            <div
                className="flex flex-nowrap justify-space-between items-center w-full relative color-hint"
                style={{ fontWeight: 'var(--font-weight-weak)' }}
            >
                <div className="text-ellipsis" title={'Wallet'}>
                    {c('Wallet Sidebar').t`Wallets`}
                </div>

                <CoreButton shape="ghost" onClick={onAddWallet} disabled={loadingApiWalletsData}>
                    <Icon name="plus-circle" />
                </CoreButton>
            </div>

            {loadingApiWalletsData ? (
                <div className="flex">
                    <CircleLoader className="color-primary mx-auto my-5" />
                </div>
            ) : (
                <ul className="unstyled mt-4">
                    {apiWalletsData?.map((wallet, index) => {
                        return (
                            <SidebarListItem
                                key={wallet.Wallet.ID}
                                className={clsx('mt-1', getThemeByIndex(index))}
                                style={{ padding: '0' }}
                            >
                                <WalletsSidebarListItem
                                    wallet={wallet}
                                    onAddWalletAccount={() => {
                                        onAddWalletAccount(wallet);
                                    }}
                                />
                            </SidebarListItem>
                        );
                    })}
                </ul>
            )}
        </SidebarListItem>
    );
};
