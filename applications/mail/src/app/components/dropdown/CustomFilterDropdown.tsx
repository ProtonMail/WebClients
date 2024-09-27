import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import {
    Checkbox,
    ConditionComparator,
    ConditionType,
    FilterModal,
    FiltersUpsellModal,
    OPERATORS,
    PrimaryButton,
    computeTree,
    newFilter,
    useModalState,
    useUser,
} from '@proton/components';
import { useFilters } from '@proton/mail/filters/hooks';
import { hasReachedFiltersLimit } from '@proton/shared/lib/helpers/filters';
import type { Message } from '@proton/shared/lib/interfaces/mail/Message';
import identity from '@proton/utils/identity';

type FiltersState = {
    [key in ConditionType]: boolean;
};

type FilterType = {
    label: string;
    value: ConditionType;
    conditionLabel: string;
};

interface Props {
    message: Message;
    onClose: () => void;
    onLock: (lock: boolean) => void;
}

const CustomFilterDropdown = ({ message, onClose, onLock }: Props) => {
    const [containFocus, setContainFocus] = useState(true);

    const [filterModalProps, setFilterModalOpen, renderFilterModal] = useModalState();
    const [upsellModalProps, handleUpsellModalDisplay, renderUpsellModal] = useModalState();

    useEffect(() => onLock(!containFocus), [containFocus]);

    const [filtersState, setFiltersState] = useState<FiltersState>({
        [ConditionType.SELECT]: false,
        [ConditionType.SUBJECT]: false,
        [ConditionType.SENDER]: false,
        [ConditionType.RECIPIENT]: false,
        [ConditionType.ATTACHMENTS]: false,
    });
    const [user] = useUser();
    const [filters = []] = useFilters();

    const FILTER_TYPES: FilterType[] = [
        {
            value: ConditionType.SUBJECT,
            label: c('CustomFilter').t`Subject`,
            conditionLabel: c('Filter modal type').t`If the subject`,
        },
        {
            value: ConditionType.SENDER,
            label: c('CustomFilter').t`Sender`,
            conditionLabel: c('Filter modal type').t`If the sender`,
        },
        {
            value: ConditionType.RECIPIENT,
            label: c('CustomFilter').t`Recipient`,
            conditionLabel: c('Filter modal type').t`If the recipient`,
        },
        {
            value: ConditionType.ATTACHMENTS,
            label: c('CustomFilter').t`Attachment`,
            conditionLabel: c('Filter modal type').t`If the attachments`,
        },
    ];

    const toggleFilterType = (filterType: ConditionType) => {
        setFiltersState({
            ...filtersState,
            [filterType]: !filtersState[filterType],
        });
    };

    const formatConditions = (conditions: ConditionType[]) => {
        return conditions.map((condition) => {
            const filterType = FILTER_TYPES.find((f) => f.value === condition) as FilterType;
            let value;

            switch (condition) {
                case ConditionType.SUBJECT:
                    value = message.Subject;
                    break;
                case ConditionType.SENDER:
                    value = message.Sender ? message.Sender.Address : '';
                    break;
                case ConditionType.RECIPIENT:
                    value = message.ToList && message.ToList.length ? message.ToList[0].Address : '';
                    break;
                case ConditionType.ATTACHMENTS:
                default:
                    value = '';
                    break;
            }

            return {
                value,
                Values: [value],
                Type: {
                    label: filterType?.conditionLabel,
                    value: filterType?.value,
                },
                Comparator: { label: 'contains', value: ConditionComparator.CONTAINS },
            };
        });
    };

    const filter = useMemo(() => {
        const filter = newFilter();
        const conditions = [];
        let filterType: ConditionType;

        for (filterType in filtersState) {
            if (filtersState[filterType]) {
                conditions.push(filterType);
            }
        }

        filter.Simple = {
            Operator: {
                label: OPERATORS[0].label,
                value: OPERATORS[0].value,
            },
            Conditions: formatConditions(conditions),
            Actions: {
                FileInto: [],
                Vacation: '',
                Mark: { Read: false, Starred: false },
            },
        };

        return filter;
    }, [filtersState]);

    const handleNext = () => {
        // Set focus state to lock the dropdown
        // We need this otherwise modal that is rendered in the dropdown will be closed if dropdown disappear from the DOM
        setContainFocus(false);

        if (hasReachedFiltersLimit(user, filters)) {
            handleUpsellModalDisplay(true);
        } else {
            setFilterModalOpen(true);
        }
    };

    const buttonDisabled = !Object.values(filtersState).some(identity);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        handleNext();
    };

    return (
        <>
            <form onSubmit={handleSubmit}>
                <div className="m-4">
                    <span className="text-bold" tabIndex={-2}>
                        {c('CustomFilter').t`Filter on`}
                    </span>
                </div>
                <ul className="unstyled my-4">
                    {FILTER_TYPES.map((filterType: FilterType) => (
                        <li
                            key={filterType.value}
                            className="dropdown-item w-full flex flex-nowrap items-center py-2 px-4"
                        >
                            <Checkbox
                                className="shrink-0 mr-2"
                                id={filterType.value}
                                data-testid={`custom-filter-checkbox:${filterType.value}`}
                                checked={filtersState[filterType.value]}
                                onChange={() => toggleFilterType(filterType.value)}
                            />
                            <label htmlFor={filterType.value} title={filterType.label} className="flex-1 text-ellipsis">
                                {filterType.label}
                            </label>
                        </li>
                    ))}
                </ul>
                <div className="m-4">
                    <PrimaryButton
                        className="w-full"
                        disabled={buttonDisabled}
                        data-prevent-arrow-navigation
                        type="submit"
                        data-testid="filter-dropdown:next-button"
                    >
                        {c('CustomFilter').t`Next`}
                    </PrimaryButton>
                </div>
            </form>
            {renderFilterModal && (
                <FilterModal
                    filter={{
                        ...filter,
                        Tree: computeTree(filter),
                    }}
                    onCloseCustomAction={() => setContainFocus(true)}
                    {...filterModalProps}
                />
            )}
            {renderUpsellModal && (
                <FiltersUpsellModal
                    modalProps={upsellModalProps}
                    onCloseCustomAction={() => {
                        setContainFocus(true);
                        onClose();
                    }}
                />
            )}
        </>
    );
};

export default CustomFilterDropdown;
