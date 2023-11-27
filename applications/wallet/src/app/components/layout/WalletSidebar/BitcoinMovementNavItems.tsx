import { c } from 'ttag';

import { SidebarListItem } from '@proton/components/components';

import { SidebarItemContent } from './SidebarItemContent';

export const BitcoinMovementNavItems = () => {
    const labelBuyBitcoin = c('Wallet Sidebar').t`Buy Bitcoin`;
    const labelTransferBitcoin = c('Wallet Sidebar').t`Transfer Bitcoin`;

    return (
        <>
            <SidebarListItem className="my-5">
                <SidebarItemContent
                    icon="money-bills"
                    to="/buy"
                    data-testid="wallet-sidebar:buy"
                    label={labelBuyBitcoin}
                />
            </SidebarListItem>
            <SidebarListItem>
                <SidebarItemContent
                    icon="credit-card"
                    to="/transfer"
                    data-testid="wallet-sidebar:transfer"
                    label={labelTransferBitcoin}
                />
            </SidebarListItem>
        </>
    );
};
