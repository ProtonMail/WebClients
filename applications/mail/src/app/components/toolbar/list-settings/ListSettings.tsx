import type { MailSettings } from '@proton/shared/lib/interfaces';
import type { Filter, Sort } from '@proton/shared/lib/mail/search';
import { useFlag } from '@proton/unleash/useFlag';

import { FilterActions } from './FilterActions';
import { FilterList } from './FilterList';
import { SortDropdown } from './SortDropdown';

export interface ListSettingsProps {
    sort: Sort;
    onSort: (sort: Sort) => void;
    filter: Filter;
    onFilter: (filter: Filter) => void;
    conversationMode: boolean;
    mailSettings: MailSettings;
    labelID?: string;
    filterAsDropdown?: boolean;
}

export const ListSettings = ({
    sort,
    onSort,
    onFilter,
    filter,
    conversationMode,
    mailSettings,
    labelID,
    filterAsDropdown,
}: ListSettingsProps) => {
    const isRefreshedFilterUIDisabled = useFlag('RefreshedFilterUIDisabled');
    if (isRefreshedFilterUIDisabled) {
        return (
            <div className="flex flex-nowrap justify-space-between items-center gap-2 m-auto">
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
    }

    return <FilterList />;
};
