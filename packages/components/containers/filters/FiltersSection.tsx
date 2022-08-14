import { useEffect, useState } from 'react';
import { ContainerGetter, SortEndHandler, arrayMove } from 'react-sortable-hoc';

import { c } from 'ttag';

import { applyFilters, updateFilterOrder } from '@proton/shared/lib/api/filters';

import { Loader } from '../../components';
import { useApi, useApiWithoutResult, useEventManager, useFeature, useFilters, useNotifications } from '../../hooks';
import { SettingsParagraph, SettingsSection } from '../account';
import { FeatureCode } from '../features';
import ActionsFilterToolbar from './ActionsFilterToolbar';
import FilterSortableList from './FilterSortableList';
import { Filter } from './interfaces';

function FiltersSection() {
    const { feature: applyFiltersFeature } = useFeature(FeatureCode.ApplyFilters);
    const { call } = useEventManager();
    const [filters, loading] = useFilters();
    const orderRequest = useApiWithoutResult(updateFilterOrder);
    const { createNotification } = useNotifications();
    const api = useApi();
    const handleApplyFilter = async (filterId: string) => {
        // Handle Filter API call
        await api(applyFilters([filterId]));

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

    const getScrollContainer: ContainerGetter = () => document.querySelector('.main-area') as HTMLElement;

    const onSortEnd: SortEndHandler = async ({ oldIndex, newIndex }) => {
        try {
            const nextFilters: Filter[] = arrayMove(list, oldIndex, newIndex);
            setFilters(nextFilters);

            const filterIds = nextFilters.map(({ ID }) => ID);
            await orderRequest.request(filterIds);
            await call();
        } catch (e: any) {
            setFilters(filters);
        }
    };

    const contentRenderer = () => {
        if (loading) {
            return <Loader />;
        }

        return list.length ? (
            <FilterSortableList
                getContainer={getScrollContainer}
                items={list}
                onSortEnd={onSortEnd}
                onApplyFilter={handleApplyFilter}
                canApplyFilters={applyFiltersFeature?.Value === true}
            />
        ) : null;
    };

    return (
        <SettingsSection>
            <SettingsParagraph>
                {c('FilterSettings')
                    .t`Add a custom filter to automatically perform certain actions, like labeling or archiving messages. Filters can be edited and created directly via Sieve programming language.`}
            </SettingsParagraph>

            <ActionsFilterToolbar />

            {contentRenderer()}
        </SettingsSection>
    );
}

export default FiltersSection;
