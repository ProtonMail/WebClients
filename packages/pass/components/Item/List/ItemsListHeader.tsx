import { memo } from 'react';

import { c } from 'ttag';

import { useItems } from '@proton/pass/components/Item/Context/ItemsProvider';
import { ScopeFilter } from '@proton/pass/components/Item/Filters/Scope';
import { ItemsListActions } from '@proton/pass/components/Item/List/ItemsListActions';
import { useItemScope } from '@proton/pass/components/Navigation/NavigationMatches';
import { SecureLinkQuickActions } from '@proton/pass/components/SecureLink/SecureLinkQuickActions';

import { getVaultOptionInfo } from '../../Menu/Vault/utils';

export const ItemsListHeader = memo(() => {
    const scope = useItemScope();
    const items = useItems();
    const empty = items.totalCount === 0;

    return (
        !empty && (
            <div className="flex flex-row grow-0 shrink-0 flex-nowrap p-3 gap-1 overflow-x-auto justify-space-between">
                {(() => {
                    switch (scope) {
                        case 'secure-links':
                            return (
                                <>
                                    <ScopeFilter
                                        label={c('Action').t`Secure links`}
                                        count={items.totalCount}
                                        icon={getVaultOptionInfo('secure-links').icon}
                                    />
                                    <SecureLinkQuickActions />
                                </>
                            );

                        case 'shared-with-me':
                            return (
                                <ScopeFilter
                                    label={c('Label').t`Shared with me`}
                                    count={items.totalCount}
                                    icon={getVaultOptionInfo('shared-with-me').icon}
                                />
                            );

                        case 'shared-by-me':
                            return (
                                <ScopeFilter
                                    label={c('Label').t`Shared by me`}
                                    count={items.totalCount}
                                    icon={getVaultOptionInfo('shared-by-me').icon}
                                />
                            );

                        default:
                            return <ItemsListActions />;
                    }
                })()}
            </div>
        )
    );
});

ItemsListHeader.displayName = 'ItemsListHeaderMemo';
