import { memo } from 'react';

import { MailSettings } from '@proton/shared/lib/interfaces';

import { Filter, Sort } from '../../models/tools';
import FilterActions from '../toolbar/FilterActions';
import SortDropdown from '../toolbar/SortDropdown';

interface Props {
    sort: Sort;
    onSort: (sort: Sort) => void;
    filter: Filter;
    onFilter: (filter: Filter) => void;
    conversationMode: boolean;
    mailSettings: MailSettings;
    isSearch: boolean;
    labelID?: string;
}

const ListSettings = ({ sort, onSort, onFilter, filter, conversationMode, mailSettings, isSearch, labelID }: Props) => {
    return (
        <div className="sticky-top upper-layer bg-norm border-bottom border-weak px0-5 py0-25 flex flex-wrap flex-justify-space-between">
            <FilterActions filter={filter} onFilter={onFilter} mailSettings={mailSettings} />
            <SortDropdown
                conversationMode={conversationMode}
                sort={sort}
                onSort={onSort}
                hasCaret={false}
                isSearch={isSearch}
                labelID={labelID}
            />
        </div>
    );
};

export default memo(ListSettings);
