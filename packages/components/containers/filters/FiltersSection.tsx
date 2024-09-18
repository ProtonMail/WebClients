import { useEffect, useState } from 'react';
import type { ContainerGetter, SortEndHandler } from 'react-sortable-hoc';
import { arrayMove } from 'react-sortable-hoc';

import { c } from 'ttag';

import { Href } from '@proton/atoms';
import Loader from '@proton/components/components/loader/Loader';
import { applyFilters, updateFilterOrder } from '@proton/shared/lib/api/filters';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import { useApi, useEventManager, useFilters, useNotifications } from '../../hooks';
import { SettingsParagraph, SettingsSection } from '../account';
import ActionsFilterToolbar from './ActionsFilterToolbar';
import FilterSortableList from './FilterSortableList';
import type { Filter } from './interfaces';

function FiltersSection() {
    const { call } = useEventManager();
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

    const getScrollContainer: ContainerGetter = () => document.querySelector('.main-area') as HTMLElement;

    const onSortEnd: SortEndHandler = async ({ oldIndex, newIndex }) => {
        try {
            const nextFilters: Filter[] = arrayMove(list, oldIndex, newIndex);
            setFilters(nextFilters);

            const filterIds = nextFilters.map(({ ID }) => ID);
            await api(updateFilterOrder(filterIds));
            await call();
        } catch (e: any) {
            setFilters(filters || []);
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
            />
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
