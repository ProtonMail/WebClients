import { useEffect, useMemo, useState } from 'react';
import * as React from 'react';

import { c } from 'ttag';

import {
    Checkbox,
    FilterConstants,
    FilterUtils,
    PrimaryButton,
    useFilters,
    useModalState,
    useNotifications,
    useUser,
} from '@proton/components';
import { ConditionComparator, ConditionType, Filter } from '@proton/components/containers/filters/interfaces';
import FilterModal from '@proton/components/containers/filters/modal/FilterModal';
import { FILTER_STATUS } from '@proton/shared/lib/constants';
import { Message } from '@proton/shared/lib/interfaces/mail/Message';
import { isPaid } from '@proton/shared/lib/user/helpers';
import identity from '@proton/utils/identity';

const { computeTree, newFilter } = FilterUtils;
const { OPERATORS } = FilterConstants;

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

    useEffect(() => onLock(!containFocus), [containFocus]);

    const [filtersState, setFiltersState] = useState<FiltersState>({
        [ConditionType.SELECT]: false,
        [ConditionType.SUBJECT]: false,
        [ConditionType.SENDER]: false,
        [ConditionType.RECIPIENT]: false,
        [ConditionType.ATTACHMENTS]: false,
    });
    const { createNotification } = useNotifications();
    const [user] = useUser();
    const [filters = []] = useFilters() as [Filter[], boolean, Error];

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
        if (!isPaid(user) && filters.filter((filter) => filter.Status === FILTER_STATUS.ENABLED).length > 0) {
            createNotification({
                text: c('Error').t`Too many active filters. Please upgrade to a paid plan to activate more filters.`,
                type: 'error',
            });
            onClose();
            return;
        }
        setContainFocus(false);
        setFilterModalOpen(true);
    };

    const buttonDisabled = !Object.values(filtersState).some(identity);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        handleNext();
    };

    return (
        <>
            <form onSubmit={handleSubmit}>
                <div className="m1">
                    <span className="text-bold" tabIndex={-2}>
                        {c('CustomFilter').t`Filter on`}
                    </span>
                </div>
                <ul className="unstyled mt1 mb1">
                    {FILTER_TYPES.map((filterType: FilterType) => (
                        <li
                            key={filterType.value}
                            className="dropdown-item w100 flex flex-nowrap flex-align-items-center p0-5 pl1 pr1"
                        >
                            <Checkbox
                                className="flex-item-noshrink mr0-5"
                                id={filterType.value}
                                checked={filtersState[filterType.value]}
                                onChange={() => toggleFilterType(filterType.value)}
                            />
                            <label
                                htmlFor={filterType.value}
                                title={filterType.label}
                                className="flex-item-fluid text-ellipsis"
                            >
                                {filterType.label}
                            </label>
                        </li>
                    ))}
                </ul>
                <div className="m1">
                    <PrimaryButton
                        className="w100"
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
        </>
    );
};

export default CustomFilterDropdown;
