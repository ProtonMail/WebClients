import { c } from 'ttag';

import { SidebarListItem } from '@proton/components/components';

import { SidebarItemContent } from './SidebarItemContent';

export const TransactionsNavItem = () => {
    return (
        <SidebarListItem className="my-1">
            {/** TODO: change to correct route */}

            <SidebarItemContent
                to="/transactions"
                icon="arrow-right-arrow-left"
                data-testid="wallet-sidebar:transactions"
                label={c('Wallet Sidebar').t`Transactions`}
            />
        </SidebarListItem>
    );
};
