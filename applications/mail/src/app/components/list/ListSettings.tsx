import React from 'react';

import FilterDropdown from '../toolbar/FilterDropdown';
import SortDropdown from '../toolbar/SortDropdown';
import { Sort, Filter } from '../../models/tools';

interface Props {
    labelID: string;
    sort: Sort;
    onSort: (sort: Sort) => void;
    filter: Filter;
    onFilter: (filter: Filter) => void;
    conversationMode: boolean;
    onNavigate: (labelID: string) => void;
}

const ListSettings = ({ sort, onSort, onFilter, onNavigate, filter, labelID, conversationMode }: Props) => {
    return (
        <div className="sticky-top z10 bg-white-dm border-bottom pl0-5 pr0-5 pt0-25 pb0-25 flex flex-wrap flex-justify-space-between">
            <FilterDropdown
                labelID={labelID}
                filter={filter}
                onFilter={onFilter}
                onNavigate={onNavigate}
                hasCaret={false}
                className="bg-global-muted-dm-on-hover opacity-65 on-hover-opacity-100 rounded pl0-5 pr0-5 pt0-25 pb0-25"
            />
            <SortDropdown
                conversationMode={conversationMode}
                sort={sort}
                onSort={onSort}
                hasCaret={false}
                className="bg-global-muted-dm-on-hover opacity-65 on-hover-opacity-100 rounded pl0-5 pr0-5 pt0-25 pb0-25"
            />
        </div>
    );
};

export default ListSettings;
