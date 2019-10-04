import React, { useEffect, useState } from 'react';
import { c } from 'ttag';
import { SubTitle, Block, Alert, Loader, useFilters, useApiWithoutResult, useEventManager } from 'react-components';
import { arrayMove } from 'react-sortable-hoc';
import { updateFilterOrder } from 'proton-shared/lib/api/filters';

import FilterSortableList from './SortableList';
import ActionsFilterToolbar from './ActionsFilterToolbar';

function FiltersSection() {
    const { call } = useEventManager();
    const [filters, loading] = useFilters();
    const orderRequest = useApiWithoutResult(updateFilterOrder);

    const [list, setFilters] = useState(() => filters || []);

    useEffect(() => {
        if (!Array.isArray(filters)) {
            return;
        }
        setFilters(filters);
    }, [filters]);

    const getScrollContainer = () => document.querySelector('.main-area');
    const onSortEnd = async ({ oldIndex, newIndex }) => {
        try {
            const newList = arrayMove(list, oldIndex, newIndex);
            setFilters(newList);
            await orderRequest.request(newList.map(({ ID }) => ID));
            call();
        } catch (e) {
            setFilters(filters);
        }
    };

    return (
        <>
            <SubTitle>{c('FilterSettings').t`Custom Filters`}</SubTitle>
            <Alert type="info">
                {c('FilterSettings')
                    .t`Add a custom filter to perform actions suche as automatically labeling or archiving messages.`}
            </Alert>

            <Block>
                <ActionsFilterToolbar />
            </Block>

            {loading ? (
                <Loader />
            ) : list.length ? (
                <FilterSortableList getContainer={getScrollContainer} items={list} onSortEnd={onSortEnd} />
            ) : (
                <Alert>{c('FilterSettings').t`No filters available`}</Alert>
            )}
        </>
    );
}

export default FiltersSection;
