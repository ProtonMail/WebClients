import { ReactElement, memo } from 'react';

import { MailSettings } from '@proton/shared/lib/interfaces';

import { Filter, Sort } from '../../models/tools';
import FilterActions from '../toolbar/FilterActions';
import SortDropdown from '../toolbar/SortDropdown';

export interface Props {
    sort: Sort;
    onSort: (sort: Sort) => void;
    filter: Filter;
    onFilter: (filter: Filter) => void;
    conversationMode: boolean;
    mailSettings: MailSettings;
    isSearch: boolean;
    labelID?: string;
    selectAll?: ReactElement;
    filterAsDropdown?: boolean;
}

const ListSettings = ({
    sort,
    onSort,
    onFilter,
    filter,
    conversationMode,
    mailSettings,
    isSearch,
    labelID,
    selectAll,
    filterAsDropdown,
}: Props) => {
    return (
        <div className="flex flex-nowrap justify-space-between flex-align-items-center gap-2 m-auto">
            {selectAll && <div className="mr-auto">{selectAll}</div>}
            <FilterActions filter={filter} onFilter={onFilter} mailSettings={mailSettings} dropdown={filterAsDropdown} />
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
