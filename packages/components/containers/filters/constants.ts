import { c } from 'ttag';

import { FilterStatement, ConditionType, ConditionComparator } from './interfaces';

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
        label: c('Filter modal type').t`Select…`,
        value: ConditionType.SELECT,
    },
    {
        label: c('Filter modal type').t`The subject`,
        value: ConditionType.SUBJECT,
    },
    {
        label: c('Filter modal type').t`The sender`,
        value: ConditionType.SENDER,
    },
    {
        label: c('Filter modal type').t`The recipient`,
        value: ConditionType.RECIPIENT,
    },
    {
        label: c('Filter modal type').t`The attachment`,
        value: ConditionType.ATTACHMENTS,
    },
];

export const COMPARATORS = [
    {
        label: c('Condition for custom filter').t`contains`,
        value: ConditionComparator.CONTAINS,
    },
    {
        label: c('Condition for custom filter').t`is exactly`,
        value: ConditionComparator.IS,
    },
    {
        label: c('Condition for custom filter').t`begins with`,
        value: ConditionComparator.STARTS,
    },
    {
        label: c('Condition for custom filter').t`ends with`,
        value: ConditionComparator.ENDS,
    },
    {
        label: c('Condition for custom filter').t`matches`,
        value: ConditionComparator.MATCHES,
    },
    {
        label: c('Condition for custom filter').t`does not contain`,
        value: ConditionComparator.DOES_NOT_CONTAIN,
    },
    {
        label: c('Condition for custom filter').t`is not`,
        value: ConditionComparator.IS_NOT,
    },
    {
        label: c('Condition for custom filter').t`does not begin with`,
        value: ConditionComparator.DOES_NOT_START,
    },
    {
        label: c('Condition for custom filter').t`does not end with`,
        value: ConditionComparator.DOES_NOT_END,
    },
    {
        label: c('Condition for custom filter').t`does not match`,
        value: ConditionComparator.DOES_NOT_MATCH,
    },
];

export const OPERATORS = [
    {
        label: c('Filter modal operators').t`All conditions must be fulfilled (AND)`,
        value: FilterStatement.ALL,
    },
    {
        label: c('Filter modal operators').t`One condition must be fulfilled (OR)`,
        value: FilterStatement.ANY,
    },
];

export const DEFAULT_FOLDERS = [
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
