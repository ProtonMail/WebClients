import type { ReactElement } from 'react';
import { memo } from 'react';

import type { MailSettings } from '@proton/shared/lib/interfaces';
import type { Filter, Sort } from '@proton/shared/lib/mail/search';

import FilterActions from '../toolbar/FilterActions';
import SortDropdown from '../toolbar/SortDropdown';

export interface Props {
    sort: Sort;
    onSort: (sort: Sort) => void;
    filter: Filter;
    onFilter: (filter: Filter) => void;
    conversationMode: boolean;
    mailSettings: MailSettings;
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
    labelID,
    selectAll,
    filterAsDropdown,
}: Props) => {
    return (
        <div className="flex flex-nowrap justify-space-between items-center gap-2 m-auto">
            {selectAll && <div className="mr-auto">{selectAll}</div>}
            <FilterActions
                filter={filter}
                onFilter={onFilter}
                mailSettings={mailSettings}
                dropdown={filterAsDropdown}
            />
            <SortDropdown
                conversationMode={conversationMode}
                sort={sort}
                onSort={onSort}
                hasCaret={false}
                labelID={labelID}
            />
        </div>
    );
};

export default memo(ListSettings);
