import { memo } from 'react';

import { c } from 'ttag';

import { SearchableListPlaceholder } from '@proton/pass/components/Item/List/Placeholder/SearchableListPlaceholder';
import { VaultPlaceholder } from '@proton/pass/components/Item/List/Placeholder/VaultPlaceholder';
import { useItemScope } from '@proton/pass/components/Navigation/NavigationMatches';
import { SecureLinksLoading } from '@proton/pass/components/SecureLink/SecureLinksLoading';

export const ItemsListPlaceholder = memo(() => {
    const scope = useItemScope();

    return (() => {
        switch (scope) {
            case 'trash':
                return (
                    <SearchableListPlaceholder
                        emptyListTitle={c('Title').t`Trash empty`}
                        emptyListMessage={c('Info').t`Deleted items will be moved here first`}
                        noResultsMessage={c('Warning').t`No items in trash matching`}
                    />
                );

            case 'secure-links':
                return (
                    <SecureLinksLoading>
                        {/* Secure links are searchable. So it would be "No secure links matching 'xxxxxxx'" where 'xxxxxxx' is the searched string. */}
                        <SearchableListPlaceholder
                            emptyListTitle={c('Title').t`No shared secure links`}
                            noResultsMessage={c('Warning').t`No secure links matching`}
                        />
                    </SecureLinksLoading>
                );

            case 'shared-by-me':
            case 'shared-with-me':
                return (
                    <SearchableListPlaceholder
                        emptyListTitle={c('Title').t`No shared items`}
                        noResultsMessage={c('Warning').t`No shared items matching`}
                    />
                );

            default:
                return <VaultPlaceholder />;
        }
    })();
});

ItemsListPlaceholder.displayName = 'ItemsListPlaceholderMemo';
