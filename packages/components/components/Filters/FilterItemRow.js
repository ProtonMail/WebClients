import React from 'react';
import PropTypes from 'prop-types';
import { c } from 'ttag';
import { SortableElement } from 'react-sortable-hoc';
import { isComplex } from 'proton-shared/lib/filters/factory';
import { toggleEnable } from 'proton-shared/lib/api/filters';
import { FILTER_STATUS } from 'proton-shared/lib/constants';

import { Icon, Toggle, useToggle, useEventManager, useApiWithoutResult, useNotifications } from 'react-components';

import RemoveFilter from './RemoveFilter';
import EditFilterButton from './EditFilterButton';

function FilterItemRow({ filter }) {
    const { ID, Name, Status } = filter;
    const { toggle, state: toggled } = useToggle(Status === FILTER_STATUS.ENABLED);

    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const { request, loading } = useApiWithoutResult(toggleEnable);

    const handleChangeStatus = async () => {
        await request(ID, !toggled);
        toggle();
        await call();
        createNotification({
            text: c('Success notification').t`Status updated`
        });
    };

    return (
        <tr style={{ backgroundColor: 'white', cursor: 'move' }}>
            <td>
                <Icon name="text-justify" />
            </td>
            <td>{Name}</td>
            <td>
                <div className="w10">
                    <Toggle id={`item-${ID}`} loading={loading} checked={toggled} onChange={handleChangeStatus} />
                </div>
            </td>
            <td>
                {!isComplex(filter) ? <EditFilterButton filter={filter} textContent={c('Action').t`Edit`} /> : null}
                <EditFilterButton filter={filter} type="complex" textContent={c('Action').t`Edit Sieve`} />
                <RemoveFilter filter={filter} />
            </td>
        </tr>
    );
}

FilterItemRow.propTypes = {
    filter: PropTypes.object.isRequired
};

export default SortableElement(FilterItemRow);
