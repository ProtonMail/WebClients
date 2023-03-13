import { ChangeEvent, useState } from 'react';

import { c } from 'ttag';

import { deleteFilter, toggleEnable } from '@proton/shared/lib/api/filters';
import { FILTER_STATUS } from '@proton/shared/lib/constants';

import { DropdownActions, OrderableTableRow, Toggle, useModalState } from '../../components';
import { DropdownActionProps } from '../../components/dropdown/DropdownActions';
import { useApi, useEventManager, useLoading, useNotifications } from '../../hooks';
import FilterWarningModal from './FilterWarningModal';
import { Filter } from './interfaces';
import DeleteFilterModal from './modal/DeleteFilterModal';
import FilterModal from './modal/FilterModal';
import AdvancedFilterModal from './modal/advanced/AdvancedFilterModal';
import { isSieve } from './utils';

interface Props {
    filter: Filter;
    index: number;
    onApplyFilter: (filterID: string) => void;
}

function FilterItemRow({ filter, index, onApplyFilter, ...rest }: Props) {
    const api = useApi();
    const [loading, withLoading] = useLoading();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();

    const [applyFilterModalOpen, setApplyFilterModalOpen] = useState(false);
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

    const editAction: DropdownActionProps = {
        text: c('Action').t`Edit`,
        onClick: handleEdit(),
    };
    const editSieveAction: DropdownActionProps = {
        text: c('Action').t`Edit sieve`,
        onClick: handleEdit('sieve'),
    };
    const applyFilterAction: DropdownActionProps = {
        text: c('Action').t`Apply to existing messages`,
        onClick: () => setApplyFilterModalOpen(true),
    };

    const deleteFilterAction: DropdownActionProps = {
        text: c('Action').t`Delete`,
        actionType: 'delete',
        onClick: () => setDeleteFilterModalOpen(true),
    };

    const list: DropdownActionProps[] = isSieve(filter)
        ? [editSieveAction, applyFilterAction, deleteFilterAction]
        : [editAction, applyFilterAction, editSieveAction, deleteFilterAction];

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
            <FilterWarningModal
                open={applyFilterModalOpen}
                onClose={() => {
                    setApplyFilterModalOpen(false);
                }}
                onConfirm={() => {
                    setApplyFilterModalOpen(false);
                    onApplyFilter(filter.ID);
                }}
            />
        </>
    );
}

export default FilterItemRow;
