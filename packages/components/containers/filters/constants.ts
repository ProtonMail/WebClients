import { c } from 'ttag';

import { ConditionComparator, ConditionType, FilterStatement } from './interfaces';
import { SelectOption } from './modal/FilterActionsFormFolderRow';

export const EMAIL_MODE = 'email';
export const DOMAIN_MODE = 'domain';

export const FILTER_VERSION = 2;

export const getConditionTypeLabels = (type: ConditionType) => {
    switch (type) {
        case ConditionType.SELECT:
            return c('Filter modal type').t`Select…`;
        case ConditionType.SUBJECT:
            return c('Filter modal type').t`The subject`;
        case ConditionType.SENDER:
            return c('Filter modal type').t`The sender`;
        case ConditionType.RECIPIENT:
            return c('Filter modal type').t`The recipient`;
        case ConditionType.ATTACHMENTS:
            return c('Filter modal type').t`The attachment`;
        default:
            return '';
    }
};

export const getComparatorLabels = (comparator: ConditionComparator) => {
    switch (comparator) {
        case ConditionComparator.CONTAINS:
            return c('Condition for custom filter').t`contains`;
        case ConditionComparator.IS:
            return c('Condition for custom filter').t`is exactly`;
        case ConditionComparator.STARTS:
            return c('Condition for custom filter').t`begins with`;
        case ConditionComparator.ENDS:
            return c('Condition for custom filter').t`ends with`;
        case ConditionComparator.MATCHES:
            return c('Condition for custom filter').t`matches`;
        case ConditionComparator.DOES_NOT_CONTAIN:
            return c('Condition for custom filter').t`does not contain`;
        case ConditionComparator.IS_NOT:
            return c('Condition for custom filter').t`is not`;
        case ConditionComparator.DOES_NOT_START:
            return c('Condition for custom filter').t`does not begin with`;
        case ConditionComparator.DOES_NOT_END:
            return c('Condition for custom filter').t`does not end with`;
        case ConditionComparator.DOES_NOT_MATCH:
            return c('Condition for custom filter').t`does not match`;
        default:
            return '';
    }
};

export const getOperatorLabels = (statement: FilterStatement) => {
    switch (statement) {
        case FilterStatement.ALL:
            return c('Filter modal operators').t`All conditions must be fulfilled (AND)`;
        case FilterStatement.ANY:
            return c('Filter modal operators').t`One condition must be fulfilled (OR)`;
        default:
            return '';
    }
};

export const TYPES = [
    {
        label: getConditionTypeLabels(ConditionType.SELECT),
        value: ConditionType.SELECT,
    },
    {
        label: getConditionTypeLabels(ConditionType.SUBJECT),
        value: ConditionType.SUBJECT,
    },
    {
        label: getConditionTypeLabels(ConditionType.SENDER),
        value: ConditionType.SENDER,
    },
    {
        label: getConditionTypeLabels(ConditionType.RECIPIENT),
        value: ConditionType.RECIPIENT,
    },
    {
        label: getConditionTypeLabels(ConditionType.ATTACHMENTS),
        value: ConditionType.ATTACHMENTS,
    },
];

export const COMPARATORS = [
    {
        label: getComparatorLabels(ConditionComparator.CONTAINS),
        value: ConditionComparator.CONTAINS,
    },
    {
        label: getComparatorLabels(ConditionComparator.IS),
        value: ConditionComparator.IS,
    },
    {
        label: getComparatorLabels(ConditionComparator.STARTS),
        value: ConditionComparator.STARTS,
    },
    {
        label: getComparatorLabels(ConditionComparator.ENDS),
        value: ConditionComparator.ENDS,
    },
    {
        label: getComparatorLabels(ConditionComparator.MATCHES),
        value: ConditionComparator.MATCHES,
    },
    {
        label: getComparatorLabels(ConditionComparator.DOES_NOT_CONTAIN),
        value: ConditionComparator.DOES_NOT_CONTAIN,
    },
    {
        label: getComparatorLabels(ConditionComparator.IS_NOT),
        value: ConditionComparator.IS_NOT,
    },
    {
        label: getComparatorLabels(ConditionComparator.DOES_NOT_START),
        value: ConditionComparator.DOES_NOT_START,
    },
    {
        label: getComparatorLabels(ConditionComparator.DOES_NOT_END),
        value: ConditionComparator.DOES_NOT_END,
    },
    {
        label: getComparatorLabels(ConditionComparator.DOES_NOT_MATCH),
        value: ConditionComparator.DOES_NOT_MATCH,
    },
];

export const OPERATORS = [
    {
        label: getOperatorLabels(FilterStatement.ALL),
        value: FilterStatement.ALL,
    },
    {
        label: getOperatorLabels(FilterStatement.ANY),
        value: FilterStatement.ANY,
    },
];

export const noFolderValue = '';
export const noFolderOption = {
    type: 'option',
    text: c('Filter Actions').t`Do not move`,
    value: noFolderValue,
} as SelectOption;

export const getDefaultFolders = () => {
    return [
        {
            group: c('Option group').t`Move to...`,
            text: c('Filter Actions').t`Select a folder`,
            value: '',
            disabled: true,
        },
        {
            group: c('Option group').t`Default folders`,
            text: c('Filter Actions').t`Archive`,
            value: 'archive',
        },
        {
            group: c('Option group').t`Default folders`,
            text: c('Filter Actions').t`Inbox`,
            value: 'inbox',
        },
        {
            group: c('Option group').t`Default folders`,
            text: c('Filter Actions').t`Spam`,
            value: 'spam',
        },
        {
            group: c('Option group').t`Default folders`,
            text: c('Filter Actions').t`Trash`,
            value: 'trash',
        },
    ];
};

export const getDefaultFolderOptions = () => {
    return [
        {
            type: 'label',
            text: c('Option group').t`Default folders`,
        },
        {
            type: 'option',
            text: c('Filter Actions').t`Archive`,
            value: 'archive',
        },
        {
            type: 'option',
            text: c('Filter Actions').t`Inbox - Default`,
            value: 'inbox',
        },
        {
            type: 'option',
            text: c('Filter Actions').t`Spam`,
            value: 'spam',
        },
        {
            type: 'option',
            text: c('Filter Actions').t`Trash`,
            value: 'trash',
        },
    ] as SelectOption[];
};
