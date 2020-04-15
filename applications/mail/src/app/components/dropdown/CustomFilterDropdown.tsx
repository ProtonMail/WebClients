import React, { useState } from 'react';
import { AddFilterModal, useModals, PrimaryButton, Checkbox } from 'react-components';
import { c } from 'ttag';

import { newFilter } from 'proton-shared/lib/filters/factory';
import { computeTree } from 'proton-shared/lib/filters/sieve';

import { Message } from '../../models/message';

enum AVAILABLE_FILTERS {
    SUBJECT = 'subject',
    SENDER = 'sender',
    RECIPIENT = 'recipient',
    ATTACHMENTS = 'attachments'
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
        conditionLabel: c('Filter modal type').t`If the subject`
    },
    {
        value: AVAILABLE_FILTERS.SENDER,
        label: c('CustomFilter').t`Sender`,
        conditionLabel: c('Filter modal type').t`If the sender`
    },
    {
        value: AVAILABLE_FILTERS.RECIPIENT,
        label: c('CustomFilter').t`Recipient`,
        conditionLabel: c('Filter modal type').t`If the recipient`
    },
    {
        value: AVAILABLE_FILTERS.ATTACHMENTS,
        label: c('CustomFilter').t`Attachments`,
        conditionLabel: c('Filter modal type').t`If the attachments`
    }
];

interface Props {
    message: Message;
}

const CustomFilterDropdown = ({ message }: Props) => {
    const [filtersState, setFiltersState] = useState<FiltersState>({
        [AVAILABLE_FILTERS.SUBJECT]: false,
        [AVAILABLE_FILTERS.SENDER]: false,
        [AVAILABLE_FILTERS.RECIPIENT]: false,
        [AVAILABLE_FILTERS.ATTACHMENTS]: false
    });
    const { createModal } = useModals();

    const toggleFilterType = (filterType: AVAILABLE_FILTERS) => {
        setFiltersState({
            ...filtersState,
            [filterType]: !filtersState[filterType]
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
                        value: filterType.value
                    },
                    Comparator: { label: 'contains', value: 'contains' }
                }
            );
        });
    };

    const handleNext = () => {
        const filter = newFilter();
        const conditions = [];
        let filterType: AVAILABLE_FILTERS;

        for (filterType in filtersState) {
            if (filtersState[filterType]) conditions.push(filterType);
        }

        filter.Simple.Conditions = formatConditions(conditions);
        filter.Tree = computeTree(filter);

        createModal(<AddFilterModal filter={filter} type="simple" />);
    };

    return (
        <>
            <div className="m1">
                <span className="bold">{c('CustomFilter').t`Filter on`}</span>
            </div>
            <ul className="unstyled mt1 mb1">
                {FILTER_TYPES.map((filterType: FilterType) => (
                    <li
                        key={filterType.value}
                        className="dropDown-item w100 flex flex-nowrap flex-items-center p0-5 pl1 pr1"
                    >
                        <Checkbox
                            className="flex-item-noshrink"
                            id={filterType.value}
                            checked={filtersState[filterType.value]}
                            onChange={() => toggleFilterType(filterType.value)}
                        />
                        <label htmlFor={filterType.value} title={filterType.label} className="flex-item-fluid ellipsis">
                            {filterType.label}
                        </label>
                    </li>
                ))}
            </ul>
            <div className="m1">
                <PrimaryButton className="w100" onClick={handleNext}>
                    {c('CustomFilter').t`Next`}
                </PrimaryButton>
            </div>
        </>
    );
};

export default CustomFilterDropdown;
