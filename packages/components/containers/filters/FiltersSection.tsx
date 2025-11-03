import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import Loader from '@proton/components/components/loader/Loader';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSection from '@proton/components/containers/account/SettingsSection';
import { useDispatch } from '@proton/components/containers/filters/useDispatch';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import { filtersThunk } from '@proton/mail/store/filters';
import { useFilters } from '@proton/mail/store/filters/hooks';
import { CacheType } from '@proton/redux-utilities';
import { applyFilters, updateFilterOrder } from '@proton/shared/lib/api/filters';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import move from '@proton/utils/move';

import ActionsFilterToolbar from './ActionsFilterToolbar';
import FilterSortableList from './FilterSortableList';
import type { Filter } from './interfaces';

function FiltersSection() {
    const dispatch = useDispatch();
    const [filters, loading] = useFilters();
    const api = useApi();
    const { createNotification } = useNotifications();
    const handleApplyFilter = async (filterId: string) => {
        // Handle Filter API call
        await api(applyFilters({ FilterIDs: [filterId] }));

        createNotification({
            text: c('Action').t`Filters are being applied. This might take a few minutes.`,
            type: 'success',
        });
    };

    const [list, setFilters] = useState<Filter[]>(() => filters || []);

    useEffect(() => {
        if (!Array.isArray(filters)) {
            return;
        }
        setFilters(filters);
    }, [filters]);

    const onSortEnd = async ({ oldIndex, newIndex }: { oldIndex: number; newIndex: number }) => {
        try {
            const nextFilters = move(list, oldIndex, newIndex);
            setFilters(nextFilters);

            const filterIds = nextFilters.map(({ ID }) => ID);
            await api(updateFilterOrder(filterIds));
            await dispatch(filtersThunk({ cache: CacheType.None }));
        } catch (e: any) {
            setFilters(filters || []);
        }
    };

    const contentRenderer = () => {
        if (loading) {
            return <Loader />;
        }

        return list.length ? (
            <FilterSortableList items={list} onSortEnd={onSortEnd} onApplyFilter={handleApplyFilter} />
        ) : null;
    };

    return (
        <SettingsSection>
            <SettingsParagraph>
                <span>
                    {c('FilterSettings')
                        .t`Add a custom filter to automatically perform certain actions, like labeling or archiving messages.`}
                </span>
                <br />
                <Href href={getKnowledgeBaseUrl('/email-inbox-filters')}>{c('Link').t`Learn more`}</Href>
            </SettingsParagraph>

            <ActionsFilterToolbar />

            {contentRenderer()}
        </SettingsSection>
    );
}

export default FiltersSection;
