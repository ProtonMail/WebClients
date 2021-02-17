import React, { useEffect, useState } from 'react';
import { c } from 'ttag';
import { arrayMove, ContainerGetter, SortEndHandler } from 'react-sortable-hoc';
import { updateFilterOrder } from 'proton-shared/lib/api/filters';

import { Block, Alert, Loader } from '../../components';
import { useFilters, useApiWithoutResult, useEventManager } from '../../hooks';
import FilterSortableList from './SortableList';
import ActionsFilterToolbar from './ActionsFilterToolbar';
import { Filter } from './interfaces';

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
        ) : (
            <Alert>{c('FilterSettings').t`No filters available`}</Alert>
        );
    };

    return (
        <>
            <Alert type="info">
                {c('FilterSettings')
                    .t`Add a custom filter to perform actions such as automatically labeling or archiving messages.`}
            </Alert>

            <Block>
                <ActionsFilterToolbar />
            </Block>

            {contentRenderer()}
        </>
    );
}

export default FiltersSection;
