import type { FC } from 'react';

import { useItems } from '@proton/pass/components/Item/Context/ItemsProvider';
import { useNavigationFilters } from '@proton/pass/components/Navigation/NavigationFilters';

type Props = {
    emptyListTitle: string;
    emptyListMessage?: string;
    noResultsMessage: string;
};

export const SearchableListPlaceholder: FC<Props> = ({ emptyListTitle, emptyListMessage, noResultsMessage }) => {
    const { filters } = useNavigationFilters();
    const { search } = filters;
    const { totalCount } = useItems();

    const empty = totalCount === 0;
    const hasSearch = Boolean(search.trim());

    return (
        <span className="block color-weak text-sm p-2 text-center text-break">
            {empty || !hasSearch ? (
                <span>
                    <strong className="block">{emptyListTitle}</strong>
                    {emptyListMessage}
                </span>
            ) : (
                <span>
                    {noResultsMessage}
                    <br />"{search}"
                </span>
            )}
        </span>
    );
};
