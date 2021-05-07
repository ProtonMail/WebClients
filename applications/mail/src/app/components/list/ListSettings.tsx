import React, { useState, useEffect, useRef } from 'react';
import { Progress } from 'react-components';
import { wait } from 'proton-shared/lib/helpers/promise';
import { UserSettings, MailSettings } from 'proton-shared/lib/interfaces';

import FilterButtons from '../toolbar/FilterButtons';
import SortDropdown from '../toolbar/SortDropdown';
import { Sort, Filter } from '../../models/tools';
import { useEncryptedSearchContext } from '../../containers/EncryptedSearchProvider';

interface Props {
    sort: Sort;
    onSort: (sort: Sort) => void;
    filter: Filter;
    onFilter: (filter: Filter) => void;
    conversationMode: boolean;
    userSettings: UserSettings;
    mailSettings: MailSettings;
    isSearch: boolean;
    loading: boolean;
}

const ListSettings = ({ sort, onSort, onFilter, filter, conversationMode, isSearch, loading, mailSettings, userSettings }: Props) => {
    const { getESDBStatus, getProgressRecorderRef } = useEncryptedSearchContext();
    const [value, setValue] = useState<number>(0);
    const abortControllerRef = useRef<AbortController>(new AbortController());

    const { isCacheReady, isCacheLimited, esEnabled } = getESDBStatus();
    const showProgress = isSearch && loading && esEnabled && (!isCacheReady || isCacheLimited);

    const setProgress = async () => {
        while (!abortControllerRef.current.signal.aborted) {
            setValue((value) => Math.max(value, getProgressRecorderRef().current));
            await wait(500);
        }
    };

    useEffect(() => {
        abortControllerRef.current.abort();
        if (showProgress) {
            abortControllerRef.current = new AbortController();
            void setProgress();
        } else {
            setValue(() => 0);
        }
    }, [showProgress]);

    return (
        <>
            <div className="sticky-top z10 bg-norm border-bottom--weak pl0-5 pr0-5 pt0-25 pb0-25 flex flex-wrap flex-justify-space-between">
                <FilterButtons filter={filter} onFilter={onFilter} userSettings={userSettings} mailSettings={mailSettings} />
                <SortDropdown conversationMode={conversationMode} sort={sort} onSort={onSort} hasCaret={false} />
            </div>
            {showProgress && <Progress value={Math.floor(100 * value)} />}
        </>
    );
};

export default ListSettings;
