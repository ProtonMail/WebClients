import { c } from 'ttag';

import {
    SidebarListItem,
    SidebarListItemContent,
    SidebarListItemContentIcon,
    SidebarListItemLabel,
    SidebarListItemLink,
    useToggle,
} from '@proton/components';

import { WalletWithAccountsWithBalanceAndTxs } from '../../../types';
import { SidebarItemContent } from './SidebarItemContent';
import { WalletExpandButton } from './WalletExpandButton';

interface Props {
    wallets: WalletWithAccountsWithBalanceAndTxs[];
}

export const WalletsSidebarList = ({ wallets }: Props) => {
    const { state: showWallets, toggle: toggleShowWallets } = useToggle(true);

    return (
        <div>
            <SidebarListItem>
                <SidebarListItemLabel htmlFor={`wallets-expand`} className="px-0">
                    <SidebarListItemLink to="/wallets">
                        <SidebarListItemContent
                            data-testid="wallet-sidebar:wallets"
                            left={<SidebarListItemContentIcon name="wallet" />}
                            right={<WalletExpandButton expanded={showWallets} onClick={toggleShowWallets} />}
                            className="flex w-full gap-2"
                        >
                            <div className="ml-1 flex flex-nowrap flex-justify-space-between flex-align-items-center w-full relative">
                                <div className="text-ellipsis" title={'Wallet'}>
                                    {c('Wallet Sidebar').t`Wallets`}
                                </div>
                            </div>
                        </SidebarListItemContent>
                    </SidebarListItemLink>
                </SidebarListItemLabel>
            </SidebarListItem>

            <div className="ml-6">
                {showWallets &&
                    wallets.map((wallet) => {
                        return (
                            <SidebarListItem key={wallet.WalletID} className="mt-1">
                                <SidebarItemContent
                                    icon="wallet"
                                    label={wallet.Name}
                                    to={`/wallets/${wallet.WalletID}`}
                                    data-testid="wallet-sidebar:wallet-item"
                                    disabled={!wallet.accounts.length}
                                />
                            </SidebarListItem>
                        );
                    })}
            </div>
        </div>
    );
};
