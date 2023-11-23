import { c } from 'ttag';

import { SidebarListItem, SidebarListItemLink } from '@proton/components/components';

import { SidebarItemContent } from './SidebarItemContent';

export const BitcoinMovementNavItems = () => {
    const labelBuyBitcoin = c('Wallet Sidebar').t`Buy Bitcoin`;
    const labelTransferBitcoin = c('Wallet Sidebar').t`Transfer Bitcoin`;

    return (
        <>
            <SidebarListItem className="my-5">
                <SidebarListItemLink to="/buy">
                    <SidebarItemContent icon="money-bills" data-testid="wallet-sidebar:buy" label={labelBuyBitcoin} />
                </SidebarListItemLink>
            </SidebarListItem>
            <SidebarListItem>
                <SidebarListItemLink to="/transfer">
                    <SidebarItemContent
                        icon="credit-card"
                        data-testid="wallet-sidebar:transfer"
                        label={labelTransferBitcoin}
                    />
                </SidebarListItemLink>
            </SidebarListItem>
        </>
    );
};
