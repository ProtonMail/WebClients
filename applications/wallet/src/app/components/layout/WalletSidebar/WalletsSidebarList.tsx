import { c } from 'ttag';

import {
    SidebarListItem,
    SidebarListItemContent,
    SidebarListItemContentIcon,
    SidebarListItemLabel,
    SidebarListItemLink,
    useToggle,
} from '@proton/components';
import { IWasmApiWalletData } from '@proton/wallet';

import { SidebarItemContent } from './SidebarItemContent';
import { WalletExpandButton } from './WalletExpandButton';

interface Props {
    apiWalletsData?: IWasmApiWalletData[];
}

export const WalletsSidebarList = ({ apiWalletsData }: Props) => {
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
                            <div className="ml-1 flex flex-nowrap justify-space-between items-center w-full relative">
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
                    apiWalletsData?.map((wallet) => {
                        return (
                            <SidebarListItem key={wallet.Wallet.ID} className="mt-1">
                                <SidebarItemContent
                                    icon="wallet"
                                    label={wallet.Wallet.Name}
                                    to={`/wallets/${wallet.Wallet.ID}`}
                                    data-testid="wallet-sidebar:wallet-item"
                                    disabled={wallet.IsNotDecryptable}
                                />
                            </SidebarListItem>
                        );
                    })}
            </div>
        </div>
    );
};
