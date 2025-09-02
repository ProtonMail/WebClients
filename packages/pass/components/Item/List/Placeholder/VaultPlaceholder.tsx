import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { useItems } from '@proton/pass/components/Item/Context/ItemsProvider';
import { QuickActionsPlaceholder } from '@proton/pass/components/Item/List/Placeholder/QuickActionsPlaceholder';
import { Card } from '@proton/pass/components/Layout/Card/Card';
import { useNavigationFilters } from '@proton/pass/components/Navigation/NavigationFilters';
import { UpgradeButton } from '@proton/pass/components/Upsell/UpgradeButton';
import { UpsellRef } from '@proton/pass/constants';
import { selectOwnReadOnlyVaults, selectVaultLimits, selectVisibleVaults } from '@proton/pass/store/selectors';
import { prop } from '@proton/pass/utils/fp/lens';

import { NoVaultPlaceholder } from './NoVaultPlaceholder';

export const VaultPlaceholder: FC = () => {
    const { filters } = useNavigationFilters();
    const { search, selectedShareId } = filters;
    const { totalCount } = useItems();

    const { didDowngrade } = useSelector(selectVaultLimits);
    const ownedReadOnlyShareIds = useSelector(selectOwnReadOnlyVaults).map(prop('shareId'));
    const isOwnedReadOnly = selectedShareId && ownedReadOnlyShareIds.includes(selectedShareId);

    const empty = totalCount === 0;
    const hasSearch = Boolean(search.trim());
    const showUpgrade = isOwnedReadOnly && totalCount === 0 && didDowngrade;

    /** May only happen if the organization doesn't allow vault creation
     * and default vault is not automatically created */
    const hasNoVault = useSelector(selectVisibleVaults).length === 0;
    if (hasNoVault) return <NoVaultPlaceholder />;

    if (showUpgrade) {
        return (
            <div
                className="flex flex-column items-center gap-3 text-center p-2 w-2/3 max-w-custom"
                style={{ '--max-w-custom': '20rem' }}
            >
                <span className="text-semibold inline-block">{c('Title').t`Your vault is empty`}</span>
                <Card type="primary" className="text-sm">
                    {c('Info')
                        .t`You have exceeded the number of vaults included in your subscription. New items can only be created in your first two vaults. To create new items in all vaults upgrade your subscription.`}
                </Card>
                <UpgradeButton upsellRef={UpsellRef.LIMIT_VAULT} className="pass-sub-sidebar--hidable" />
            </div>
        );
    }

    if (empty) return <QuickActionsPlaceholder />;

    return (
        <span className="block color-weak text-sm p-2 text-center text-break">
            {hasSearch ? (
                <span>
                    {c('Warning').t`No items matching`}
                    <br />"{search}"
                </span>
            ) : (
                c('Warning').t`No items`
            )}
        </span>
    );
};
