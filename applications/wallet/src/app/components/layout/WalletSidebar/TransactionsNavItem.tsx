import { c } from 'ttag';

import { SidebarListItem, SidebarListItemLink } from '@proton/components/components';

import { SidebarItemContent } from './SidebarItemContent';

export const TransactionsNavItem = () => {
    const label = c('Wallet Sidebar').t`Transactions`;

    return (
        <SidebarListItem className="my-1">
            {/** TODO: change to correct route */}
            <SidebarListItemLink to="/transaction">
                <SidebarItemContent
                    icon="arrow-right-arrow-left"
                    data-testid="wallet-sidebar:transactions"
                    label={label}
                />
            </SidebarListItemLink>
        </SidebarListItem>
    );
};
