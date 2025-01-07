import { memo } from 'react';

import { c } from 'ttag';

import { DropdownButton, Icon } from '@proton/components';
import { useItems } from '@proton/pass/components/Item/Context/ItemsProvider';
import { ItemsListActions } from '@proton/pass/components/Item/List/ItemsListActions';
import { useItemScope } from '@proton/pass/components/Navigation/NavigationMatches';
import { SecureLinkQuickActions } from '@proton/pass/components/SecureLink/SecureLinkQuickActions';

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
                                    <DropdownButton
                                        color="weak"
                                        shape="solid"
                                        size="small"
                                        className="flex flex-nowrap gap-2 grow-0 text-sm text-semibold pointer-events-none"
                                    >
                                        <Icon name="link" className="shrink-0" />
                                        <span className="text-ellipsis hidden sm:block">
                                            {c('Action').t`Secure links`} ({items.totalCount})
                                        </span>
                                    </DropdownButton>
                                    <SecureLinkQuickActions />
                                </>
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
