import React from 'react';
import { MailSettings } from '@proton/shared/lib/interfaces';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import FilterActions from '../toolbar/FilterActions';
import SortDropdown from '../toolbar/SortDropdown';
import { Sort, Filter } from '../../models/tools';

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
    const isScheduledSettings = labelID && labelID === MAILBOX_LABEL_IDS.SCHEDULED;
    return (
        <div className="sticky-top z10 bg-norm border-bottom--weak pl0-5 pr0-5 pt0-25 pb0-25 flex flex-wrap flex-justify-space-between">
            <FilterActions filter={filter} onFilter={onFilter} mailSettings={mailSettings} />
            <SortDropdown
                conversationMode={conversationMode}
                sort={sort}
                onSort={onSort}
                hasCaret={false}
                isSearch={isSearch}
                isScheduledLabel={!!isScheduledSettings}
            />
        </div>
    );
};

export default ListSettings;
