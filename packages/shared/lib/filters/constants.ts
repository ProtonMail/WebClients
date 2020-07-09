import { c } from 'ttag';

import { FilterStatement, ConditionType, ConditionComparator } from './interfaces';

export const FILTER_VERSION = 2;

export const TYPES = [
    {
        label: c('Filter modal type').t`Select ...`,
        value: ConditionType.SELECT
    },
    {
        label: c('Filter modal type').t`The subject`,
        value: ConditionType.SUBJECT
    },
    {
        label: c('Filter modal type').t`The sender`,
        value: ConditionType.SENDER
    },
    {
        label: c('Filter modal type').t`The recipient`,
        value: ConditionType.RECIPIENT
    },
    {
        label: c('Filter modal type').t`The attachment`,
        value: ConditionType.ATTACHMENTS
    }
];

export const COMPARATORS = [
    {
        label: c('Condition for custom filter').t`contains`,
        value: ConditionComparator.CONTAINS
    },
    {
        label: c('Condition for custom filter').t`is exactly`,
        value: ConditionComparator.IS
    },
    {
        label: c('Condition for custom filter').t`begins with`,
        value: ConditionComparator.STARTS
    },
    {
        label: c('Condition for custom filter').t`ends with`,
        value: ConditionComparator.ENDS
    },
    {
        label: c('Condition for custom filter').t`matches`,
        value: ConditionComparator.MATCHES
    },
    {
        label: c('Condition for custom filter').t`does not contain`,
        value: ConditionComparator.DOES_NOT_CONTAIN
    },
    {
        label: c('Condition for custom filter').t`is not`,
        value: ConditionComparator.IS_NOT
    },
    {
        label: c('Condition for custom filter').t`does not begin with`,
        value: ConditionComparator.DOES_NOT_START
    },
    {
        label: c('Condition for custom filter').t`does not end with`,
        value: ConditionComparator.DOES_NOT_END
    },
    {
        label: c('Condition for custom filter').t`does not match`,
        value: ConditionComparator.DOES_NOT_MATCH
    }
];

export const OPERATORS = [
    {
        label: c('Filter modal operators').t`All conditions must be fulfilled (AND)`,
        value: FilterStatement.ALL
    },
    {
        label: c('Filter modal operators').t`One condition must be fulfilled (OR)`,
        value: FilterStatement.ANY
    }
];
