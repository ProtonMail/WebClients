import { Message } from 'proton-shared/lib/interfaces/mail/Message';
import React, { useState } from 'react';
import {
    AddFilterModal,
    useModals,
    PrimaryButton,
    Checkbox,
    useUser,
    useFilters,
    useNotifications,
} from 'react-components';
import { c } from 'ttag';

import { newFilter } from 'proton-shared/lib/filters/factory';
import { computeTree } from 'proton-shared/lib/filters/sieve';
import { identity } from 'proton-shared/lib/helpers/function';
import { isPaid } from 'proton-shared/lib/user/helpers';
import { Filter } from 'proton-shared/lib/filters/interfaces';
import { FILTER_STATUS } from 'proton-shared/lib/constants';

enum AVAILABLE_FILTERS {
    SUBJECT = 'subject',
    SENDER = 'sender',
    RECIPIENT = 'recipient',
    ATTACHMENTS = 'attachments',
}

type FiltersState = {
    [key in AVAILABLE_FILTERS]: boolean;
};

type FilterType = {
    label: string;
    value: AVAILABLE_FILTERS;
    conditionLabel: string;
};

const FILTER_TYPES: FilterType[] = [
    {
        value: AVAILABLE_FILTERS.SUBJECT,
        label: c('CustomFilter').t`Subject`,
        conditionLabel: c('Filter modal type').t`If the subject`,
    },
    {
        value: AVAILABLE_FILTERS.SENDER,
        label: c('CustomFilter').t`Sender`,
        conditionLabel: c('Filter modal type').t`If the sender`,
    },
    {
        value: AVAILABLE_FILTERS.RECIPIENT,
        label: c('CustomFilter').t`Recipient`,
        conditionLabel: c('Filter modal type').t`If the recipient`,
    },
    {
        value: AVAILABLE_FILTERS.ATTACHMENTS,
        label: c('CustomFilter').t`Attachments`,
        conditionLabel: c('Filter modal type').t`If the attachments`,
    },
];

interface Props {
    message: Message;
    onClose: () => void;
}

const CustomFilterDropdown = ({ message, onClose }: Props) => {
    const [filtersState, setFiltersState] = useState<FiltersState>({
        [AVAILABLE_FILTERS.SUBJECT]: false,
        [AVAILABLE_FILTERS.SENDER]: false,
        [AVAILABLE_FILTERS.RECIPIENT]: false,
        [AVAILABLE_FILTERS.ATTACHMENTS]: false,
    });
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const [user] = useUser();
    const [filters = []] = useFilters() as [Filter[], boolean, Error];

    const toggleFilterType = (filterType: AVAILABLE_FILTERS) => {
        setFiltersState({
            ...filtersState,
            [filterType]: !filtersState[filterType],
        });
    };

    const formatConditions = (conditions: string[]) => {
        return conditions.map((condition) => {
            const filterType = FILTER_TYPES.find((f) => f.value === condition);
            let value;

            switch (condition) {
                case AVAILABLE_FILTERS.SUBJECT:
                    value = message.Subject;
                    break;
                case AVAILABLE_FILTERS.SENDER:
                    value = message.Sender ? message.Sender.Address : '';
                    break;
                case AVAILABLE_FILTERS.RECIPIENT:
                    value = message.ToList && message.ToList.length ? message.ToList[0].Address : '';
                    break;
                case AVAILABLE_FILTERS.ATTACHMENTS:
                default:
                    value = '';
                    break;
            }

            return (
                filterType && {
                    value,
                    Values: [value],
                    Type: {
                        label: filterType.conditionLabel,
                        value: filterType.value,
                    },
                    Comparator: { label: 'contains', value: 'contains' },
                }
            );
        });
    };

    const handleNext = () => {
        if (!isPaid(user) && filters.filter((filter) => filter.Status === FILTER_STATUS.ENABLED).length > 0) {
            createNotification({
                text: c('Error').t`Too many active filters. Please upgrade to a paid plan to activate more filters`,
                type: 'error',
            });
            onClose();
            return;
        }

        const filter = newFilter();
        const conditions = [];
        let filterType: AVAILABLE_FILTERS;

        for (filterType in filtersState) {
            if (filtersState[filterType]) {
                conditions.push(filterType);
            }
        }

        filter.Simple.Conditions = formatConditions(conditions);
        filter.Tree = computeTree(filter);

        createModal(<AddFilterModal filter={filter} />);
    };

    const buttonDisabled = !Object.values(filtersState).some(identity);

    return (
        <>
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
                            className="flex-item-noshrink"
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
                <PrimaryButton className="w100" onClick={handleNext} disabled={buttonDisabled}>
                    {c('CustomFilter').t`Next`}
                </PrimaryButton>
            </div>
        </>
    );
};

export default CustomFilterDropdown;
