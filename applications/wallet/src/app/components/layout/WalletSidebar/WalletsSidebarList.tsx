import { c } from 'ttag';

import {
    SidebarListItem,
    SidebarListItemContent,
    SidebarListItemContentIcon,
    SidebarListItemLabel,
    SidebarListItemLink,
    useToggle,
} from '@proton/components';

import { SidebarItemContent } from './SidebarItemContent';
import { WalletExpandButton } from './WalletExpandButton';

export const WalletsList = () => {
    const { state: showWallets, toggle: toggleShowWallets } = useToggle(true);

    const wallets: any[] = ['ah', 'b']; // TODO: replace

    return (
        <div>
            <SidebarListItemLink to="/wallets">
                <SidebarListItem>
                    <SidebarListItemLabel htmlFor={`wallets-expand`} className="group-hover-opacity-container">
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
                    </SidebarListItemLabel>
                </SidebarListItem>
            </SidebarListItemLink>

            <div className="ml-6">
                {showWallets &&
                    wallets.map((_, index) => (
                        <SidebarListItem key={index}>
                            <SidebarListItemLabel htmlFor={`wallet-${index}`} className="group-hover-opacity-container">
                                <SidebarItemContent
                                    label="Wallet"
                                    icon="wallet"
                                    data-testid="wallet-sidebar:wallet-item"
                                />
                            </SidebarListItemLabel>
                        </SidebarListItem>
                    ))}
            </div>
        </div>
    );
};
