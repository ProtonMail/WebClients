import { useMemo } from 'react';

export const useEntityTableSearch = <T>(
    entities: T[],
    searchQuery: string,
    getSearchText: (entity: T) => string | null | undefined
) => {
    const filteredEntities = useMemo(() => {
        if (!searchQuery) {
            return entities;
        }

        const query = searchQuery.toLowerCase();

        return entities.filter((entity) => getSearchText(entity)?.toLowerCase().includes(query));
    }, [entities, searchQuery, getSearchText]);

    return { filteredEntities };
};
