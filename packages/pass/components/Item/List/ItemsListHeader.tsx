import { memo } from 'react';

import { c } from 'ttag';

import { getVaultOptionInfo } from '../../Menu/Vault/utils';
import { useItemScope } from '../../Navigation/NavigationMatches';
import { SecureLinkQuickActions } from '../../SecureLink/SecureLinkQuickActions';
import { useItems } from '../Context/ItemsProvider';
import { ScopeFilter } from '../Filters/Scope';
import { ItemsListActions } from './ItemsListActions';

export const ItemsListHeader = memo(() => {
    const scope = useItemScope();
    const items = useItems();
    const empty = items.totalCount === 0;

    return (
        !empty && (
            <div className="flex flex-row grow-0 shrink-0 flex-nowrap p-3 gap-1 w-full min-w-0 justify-space-between">
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
