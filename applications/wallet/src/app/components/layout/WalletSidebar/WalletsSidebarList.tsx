import { useEffect, useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import {
    Icon,
    SidebarListItem,
    SidebarListItemButton,
    SidebarListItemContent,
    SidebarListItemContentIcon,
    SidebarListItemLink,
    SubSidebarListItem,
    Tooltip,
    useModalState,
    useToggle,
} from '@proton/components';
import clsx from '@proton/utils/clsx';
import type { IWasmApiWalletData } from '@proton/wallet';

import { CoreButton } from '../../../atoms';
import { useBitcoinBlockchainContext } from '../../../contexts';
import type { SubTheme } from '../../../utils';
import { getThemeByIndex } from '../../../utils';
import { WalletPreferencesModal } from '../../WalletPreferencesModal';
import { WalletExpandButton } from './WalletExpandButton';

interface WalletsSidebarListItemProps {
    wallet: IWasmApiWalletData;
    onAddWalletAccount: () => void;
    theme?: SubTheme;
}

const WalletsSidebarListItem = ({ wallet, onAddWalletAccount, theme }: WalletsSidebarListItemProps) => {
    const { state: showAccounts, toggle: toggleShowAccounts, set } = useToggle(false);

    const [walletPreferencesModalState, setWalletPreferencesModalState, renderWalletPreferencesModalState] =
        useModalState();

    const { walletId, accountId } = useParams<{ walletId?: string; accountId?: string }>();
    const { decryptedApiWalletsData } = useBitcoinBlockchainContext();

    const walletIndex = useMemo(
        () => decryptedApiWalletsData?.findIndex(({ Wallet }) => Wallet.ID === walletId),
        [walletId, decryptedApiWalletsData]
    );

    const otherWallets = [
        ...(decryptedApiWalletsData?.slice(0, walletIndex) ?? []),
        ...(decryptedApiWalletsData?.slice((walletIndex ?? 0) + 1) ?? []),
    ];

    const needPassphrase = Boolean(wallet.Wallet.HasPassphrase && !wallet.Wallet.Passphrase);

    const { pathname } = useLocation();
    useEffect(() => {
        if (accountId) {
            set(pathname.includes(`/wallets/${wallet.Wallet.ID}`));
        }
    }, [pathname, wallet.Wallet.ID, accountId, set]);

    return (
        <>
            <SidebarListItemLink
                to={`/wallets/${wallet.Wallet.ID}`}
                exact
                onClick={(e) => {
                    if (wallet.IsNotDecryptable) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                }}
                className={clsx(wallet.IsNotDecryptable ? 'disabled-sidebar-link' : '', 'pl-1 mb-2')}
            >
                <SidebarListItemContent
                    data-testid="wallet-sidebar:wallet-item"
                    left={<WalletExpandButton expanded={showAccounts} onClick={() => toggleShowAccounts()} />}
                    right={
                        !needPassphrase &&
                        !wallet.IsNotDecryptable && (
                            <CoreButton
                                icon
                                pill
                                size="small"
                                shape="ghost"
                                color="weak"
                                className="ml-auto shrink-0"
                                onClick={() => {
                                    setWalletPreferencesModalState(true);
                                }}
                            >
                                <Icon alt={c('Action').t`Edit`} name="cog-drawer" size={4} />
                            </CoreButton>
                        )
                    }
                    className="sidebar-item-content flex gap-1 w-full"
                >
                    <div className="block text-ellipsis" title={wallet.Wallet.Name}>
                        {wallet.Wallet.Name}
                    </div>
                </SidebarListItemContent>
                {renderWalletPreferencesModalState && (
                    <WalletPreferencesModal
                        wallet={wallet}
                        theme={theme}
                        otherWallets={otherWallets}
                        {...walletPreferencesModalState}
                    />
                )}
            </SidebarListItemLink>

            {showAccounts && !wallet.IsNotDecryptable && (
                <ul className="unstyled">
                    {wallet.WalletAccounts.map((account) => {
                        return (
                            <SidebarListItem
                                key={account.ID}
                                className="wallet-account-list-item"
                                itemClassName={'navigation-item w-full mb-0.5'}
                            >
                                <SidebarListItemLink exact to={`/wallets/${wallet.Wallet.ID}/accounts/${account.ID}`}>
                                    <SidebarListItemContent
                                        data-testid="wallet-sidebar:wallet-account-item"
                                        className="sidebar-item-content flex gap-1 w-full pl-6"
                                    >
                                        <div className="block text-ellipsis" title={account.Label}>
                                            {account.Label}
                                        </div>
                                    </SidebarListItemContent>
                                </SidebarListItemLink>
                            </SidebarListItem>
                        );
                    })}
                    <SidebarListItem
                        key="add-account"
                        className="wallet-account-list-item"
                        itemClassName={'navigation-item w-full mb-0.5'}
                    >
                        <SidebarListItemButton onClick={() => onAddWalletAccount()}>
                            <SidebarListItemContent
                                data-testid="wallet-sidebar:add-wallet-account-item"
                                left={<SidebarListItemContentIcon className="color-hint" name="plus-circle" />}
                                className="sidebar-item-content flex gap-2 w-full pl-6"
                            >
                                <div
                                    className="flex flex-row flex-nowrap justify-space-between items-center w-full relative color-hint"
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
        <SidebarListItem>
            <div
                className="flex flex-nowrap justify-space-between items-center w-full relative"
                style={{ fontWeight: 'var(--font-weight-weak)' }}
            >
                <h3 className="text-ellipsis text-lg text-semibold" title={'Wallet'}>
                    {c('Wallet Sidebar').t`Wallets`}
                </h3>

                <Tooltip title={c('Wallet Sidebar').t`Create a new wallet`}>
                    <CoreButton shape="ghost" pill icon onClick={onAddWallet} disabled={loadingApiWalletsData}>
                        <Icon name="plus-circle" />
                    </CoreButton>
                </Tooltip>
            </div>

            {loadingApiWalletsData ? (
                <div className="flex">
                    <CircleLoader className="color-primary mx-auto my-5" />
                </div>
            ) : (
                <ul className="unstyled mt-4">
                    {apiWalletsData?.map((wallet, index) => {
                        return (
                            <SubSidebarListItem key={wallet.Wallet.ID} className={clsx('m-0', getThemeByIndex(index))}>
                                <WalletsSidebarListItem
                                    wallet={wallet}
                                    onAddWalletAccount={() => {
                                        onAddWalletAccount(wallet);
                                    }}
                                    theme={getThemeByIndex(index)}
                                />
                            </SubSidebarListItem>
                        );
                    })}
                </ul>
            )}
        </SidebarListItem>
    );
};
