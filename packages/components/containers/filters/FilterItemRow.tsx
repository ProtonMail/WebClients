import { ChangeEvent } from 'react';
import { c } from 'ttag';
import { FILTER_STATUS } from '@proton/shared/lib/constants';
import isTruthy from '@proton/shared/lib/helpers/isTruthy';
import { toggleEnable, deleteFilter } from '@proton/shared/lib/api/filters';

import { Toggle, DropdownActions, OrderableTableRow, useModalState } from '../../components';
import { useApi, useEventManager, useLoading, useNotifications } from '../../hooks';

import FilterModal from './modal/FilterModal';
import AdvancedFilterModal from './modal/advanced/AdvancedFilterModal';

import { Filter } from './interfaces';
import { isSieve } from './utils';
import DeleteFilterModal from './modal/DeleteFilterModal';

interface Props {
    filter: Filter;
    index: number;
}

function FilterItemRow({ filter, index, ...rest }: Props) {
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();

    const [filterModalProps, setFilterModalOpen, renderFilterModal] = useModalState();
    const [advancedFilterModalProps, setAdvancedFilterModalOpen, renderAdvancedFilterModal] = useModalState();
    const [deleteFilterModalProps, setDeleteFilterModalOpen, renderDeleteFilterModal] = useModalState();

    const { ID, Name, Status } = filter;

    const handleChangeStatus = async ({ target }: ChangeEvent<HTMLInputElement>) => {
        await api(toggleEnable(ID, target.checked));
        await call();
        createNotification({
            text: c('Success notification').t`Status updated`,
        });
    };

    const handleRemove = async () => {
        await api(deleteFilter(filter.ID));
        await call();
        createNotification({ text: c('Success notification').t`Filter removed` });
    };

    const handleEdit = (type?: 'sieve') => () => {
        if (type === 'sieve') {
            setAdvancedFilterModalOpen(true);
        } else {
            setFilterModalOpen(true);
        }
    };

    const list = [
        !isSieve(filter) && {
            text: c('Action').t`Edit`,
            onClick: handleEdit(),
        },
        {
            text: c('Action').t`Edit sieve`,
            onClick: handleEdit('sieve'),
        },
        {
            text: c('Action').t`Delete`,
            actionType: 'delete',
            onClick: () => setDeleteFilterModalOpen(true),
        } as const,
    ].filter(isTruthy);

    return (
        <>
            <OrderableTableRow
                index={index}
                cells={[
                    <div key="name" className="text-ellipsis max-w100" title={Name}>
                        {Name}
                    </div>,
                    <div key="toggle" className="w10">
                        <Toggle
                            id={`item-${ID}`}
                            loading={loading}
                            checked={Status === FILTER_STATUS.ENABLED}
                            onChange={(e) => withLoading(handleChangeStatus(e))}
                        />
                    </div>,
                    <DropdownActions key="dropdown" size="small" list={list} />,
                ]}
                {...rest}
                className="on-mobile-hide-td3"
            />
            {renderFilterModal && <FilterModal {...filterModalProps} filter={filter} />}
            {renderAdvancedFilterModal && <AdvancedFilterModal {...advancedFilterModalProps} filter={filter} />}
            {renderDeleteFilterModal && (
                <DeleteFilterModal {...deleteFilterModalProps} filterName={filter.Name} handleDelete={handleRemove} />
            )}
        </>
    );
}

export default FilterItemRow;
