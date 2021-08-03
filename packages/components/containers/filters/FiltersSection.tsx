import { useEffect, useState } from 'react';
import { c } from 'ttag';
import { arrayMove, ContainerGetter, SortEndHandler } from 'react-sortable-hoc';
import { updateFilterOrder } from '@proton/shared/lib/api/filters';

import { Loader } from '../../components';
import { useFilters, useApiWithoutResult, useEventManager } from '../../hooks';
import FilterSortableList from './SortableList';
import ActionsFilterToolbar from './ActionsFilterToolbar';
import { Filter } from './interfaces';
import { SettingsSection, SettingsParagraph } from '../account';

function FiltersSection() {
    const { call } = useEventManager();
    const [filters, loading] = useFilters();
    const orderRequest = useApiWithoutResult(updateFilterOrder);

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
            const newList: Filter[] = arrayMove(list, oldIndex, newIndex);
            setFilters(newList);
            await orderRequest.request(newList.map(({ ID }) => ID));
            await call();
        } catch (e) {
            setFilters(filters);
        }
    };

    const contentRenderer = () => {
        if (loading) {
            return <Loader />;
        }
        return list.length ? (
            <FilterSortableList getContainer={getScrollContainer} items={list} onSortEnd={onSortEnd} />
        ) : null;
    };

    return (
        <SettingsSection>
            <SettingsParagraph>
                {c('FilterSettings')
                    .t`Add a custom filter to automatically perform certain actions, like labeling or archiving messages.`}
            </SettingsParagraph>

            <ActionsFilterToolbar />

            {contentRenderer()}
        </SettingsSection>
    );
}

export default FiltersSection;
