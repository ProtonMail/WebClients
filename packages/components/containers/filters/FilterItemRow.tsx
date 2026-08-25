import type { ChangeEvent } from 'react';
import { useState } from 'react';

import { useSortable } from '@dnd-kit/react/sortable';
import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useNotifications } from '@proton/app-context/useNotifications';
import { useLoading } from '@proton/hooks';
import { deleteFilter, enableFilter } from '@proton/mail/store/filters/actions';
import { FILTER_STATUS } from '@proton/shared/lib/constants';
import { hasReachedFiltersLimit } from '@proton/shared/lib/helpers/filters';
import type { Filter } from '@proton/sieve/filterModel';
import noop from '@proton/utils/noop';

import type { DropdownActionProps } from '../../components/dropdown/DropdownActions';
import DropdownActions from '../../components/dropdown/DropdownActions';
import useModalState from '../../components/modalTwo/useModalState';
import { Handle } from '../../components/table/Handle';
import TableCell from '../../components/table/TableCell';
import TableRow from '../../components/table/TableRow';
import Toggle from '../../components/toggle/Toggle';
import FiltersUpsellModal from '../../components/upsell/modals/FiltersUpsellModal';
import FilterWarningModal from './FilterWarningModal';
import DeleteFilterModal from './modal/DeleteFilterModal';
import FilterModal from './modal/FilterModal';
import AdvancedFilterModal from './modal/advanced/AdvancedFilterModal';
import { useFilterDispatch } from './useFilterDispatch';
import { isSieve } from './utils';

interface Props {
    index: number;
    filter: Filter;
    filters: Filter[];
    onApplyFilter: (filterID: string) => void;
}

function FilterItemRow({ index, filter, filters, onApplyFilter }: Props) {
    const { isDragging, ref: sortableRef, handleRef } = useSortable({ id: filter.ID, index });
    const [user] = useUser();
    const [loading, withLoading] = useLoading();
    const dispatch = useFilterDispatch();
    const { createNotification } = useNotifications();

    const [applyFilterModalOpen, setApplyFilterModalOpen] = useState(false);
    const [filterModalProps, setFilterModalOpen, renderFilterModal] = useModalState();
    const [advancedFilterModalProps, setAdvancedFilterModalOpen, renderAdvancedFilterModal] = useModalState();
    const [deleteFilterModalProps, setDeleteFilterModalOpen, renderDeleteFilterModal] = useModalState();

    const { ID, Name, Status } = filter;

    const [upsellModalProps, handleUpsellModalDisplay, renderUpsellModal] = useModalState();

    const handleChangeStatus = async ({ target }: ChangeEvent<HTMLInputElement>) => {
        await dispatch(enableFilter({ filter, enabled: target.checked }));
        createNotification({
            text: c('Success notification').t`Status updated`,
        });
    };

    const handleRemove = async () => {
        await dispatch(deleteFilter({ filter }));
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
        label: c('Action').t`Edit filter “${Name}”`,
        onClick: handleEdit(),
    };
    const editSieveAction: DropdownActionProps = {
        text: c('Action').t`Edit Sieve`,
        label: c('Action').t`Edit Sieve filter “${Name}”`,
        onClick: handleEdit('sieve'),
    };
    const applyFilterAction: DropdownActionProps = {
        text: c('Action').t`Apply to existing messages`,
        label: c('Action').t`Apply filter “${Name}” to existing messages`,
        onClick: () => setApplyFilterModalOpen(true),
    };

    const deleteFilterAction: DropdownActionProps = {
        text: c('Action').t`Delete`,
        label: c('Action').t`Delete filter “${Name}”`,
        actionType: 'delete',
        onClick: () => setDeleteFilterModalOpen(true),
    };

    const list: DropdownActionProps[] = isSieve(filter)
        ? [editSieveAction, applyFilterAction, deleteFilterAction]
        : [editAction, applyFilterAction, editSieveAction, deleteFilterAction];

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (Status === FILTER_STATUS.DISABLED && hasReachedFiltersLimit(user, filters)) {
            handleUpsellModalDisplay(true);
        } else {
            withLoading(handleChangeStatus(e)).catch(noop);
        }
    };

    return (
        <>
            <TableRow ref={sortableRef} dragging={isDragging}>
                <TableCell ref={handleRef}>
                    <Handle />
                </TableCell>
                <TableCell>
                    <div key="name" className="text-ellipsis max-w-full" title={Name}>
                        <Toggle
                            id={`item-${ID}`}
                            loading={loading}
                            checked={Status === FILTER_STATUS.ENABLED}
                            onChange={handleChange}
                            className="mr-2 align-bottom inline-flex"
                        />
                        {Name}
                    </div>
                </TableCell>
                <TableCell>
                    <DropdownActions key="dropdown" size="small" list={list} />
                </TableCell>
            </TableRow>
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
            {renderUpsellModal && <FiltersUpsellModal modalProps={upsellModalProps} isSettings />}
        </>
    );
}

export default FilterItemRow;
