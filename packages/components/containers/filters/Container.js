import React, { useEffect, useState } from 'react';
import { c } from 'ttag';
import {
    SubTitle,
    Group,
    Paragraph,
    Alert,
    Loader,
    useFilters,
    useApiWithoutResult,
    useEventManager
} from 'react-components';
import { arrayMove } from 'react-sortable-hoc';
import { updateFilterOrder } from 'proton-shared/lib/api/filters';

import FilterSortableList from '../../containers/filters/SortableList';
import ActionsFilterToolbar from '../../containers/filters/ActionsFilterToolbar';

function FiltersContainer() {
    const { call } = useEventManager();
    const [filters, loading] = useFilters();
    const orderRequest = useApiWithoutResult(updateFilterOrder);

    const [list, setFilters] = useState(filters || []);

    useEffect(() => {
        setFilters(filters || []);
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
            <Alert learnMore="https://protonmail.com" type="info">
                {c('FilterSettings')
                    .t`Add a custom filter to perform actions suche as automatically labeling or archiving messages.`}
            </Alert>

            <Group>
                <ActionsFilterToolbar />
            </Group>

            {loading ? <Loader /> : null}

            {!loading && list.length ? (
                <FilterSortableList
                    getContainer={getScrollContainer}
                    pressDelay={200}
                    items={list}
                    onSortEnd={onSortEnd}
                />
            ) : (
                <Paragraph>No filers available</Paragraph>
            )}
        </>
    );
}

export default FiltersContainer;
