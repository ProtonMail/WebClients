import { ConditionComparator, FilterActions } from '@proton/components/containers/filters/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import { buildLabelValueObject, findLatest, unescapeCharacters, unescapeVariables } from '../helpers';
import {
    IfTest,
    ItType,
    LABEL_KEYS,
    LABEL_KEY_MATCHING,
    LABEL_KEY_TYPE,
    MainNodeType,
    PrepareType,
    ValueNamePair,
    ValueTextPair,
    ValueTypePair,
} from '../interface';

/**
 * Parse a specific comment annotation
 */
const prepareComment = (commentComparator?: string) => {
    if (!commentComparator) {
        return {};
    }

    const negate = commentComparator.startsWith('!');
    return {
        negate,
        comparator: negate ? commentComparator.slice(1) : commentComparator,
    };
};

/**
 * Builds a simple condition.
 */
const buildSimpleCondition = (type: LABEL_KEY_TYPE, comparator: LABEL_KEY_TYPE, params: {}) => {
    return {
        Type: buildLabelValueObject(type),
        Comparator: buildLabelValueObject(comparator),
        ...params,
    };
};

/**
 * Prepares single condition.
 */
const prepareSingleCondition = (element: { Type: string; Test?: any }) => {
    const negate = element.Type === 'Not';
    return {
        negate,
        element: negate ? element.Test : element,
    };
};

/**
 * Prepare the type.
 */
const prepareType = (element: PrepareType) => {
    const hasHeader = (Headers: string, key: string, value: string) => {
        return Headers.includes(key) ? value : '';
    };
    const hasAnyHeader = (element: PrepareType, keys: string[], value: string) => {
        return keys.some((key) => hasHeader(element.Headers, key, value)) ? value : '';
    };

    const { Headers, Type } = element;

    if (Type === 'Exists') {
        return hasHeader(Headers, 'X-Attached', 'attachments');
    } else if (Type === 'Header') {
        return hasHeader(Headers, 'Subject', 'subject');
    } else if (Type === 'Address') {
        return hasHeader(Headers, 'From', 'sender') || hasAnyHeader(element, ['To', 'Cc', 'Bcc'], 'recipient');
    }

    return '';
};

/**
 * Builds the simple comparator .
 */
const buildSimpleComparator = (comparator: string, negate: boolean) => {
    const value = LABEL_KEY_MATCHING.find((item) => item.match === comparator);
    if (!value) {
        throw new Error('Invalid match keys');
    }

    const key = (negate ? value.negate : value.default) as LABEL_KEY_TYPE;

    return buildLabelValueObject(key);
};

/**
 * Builds simple parameters.
 */
const buildSimpleParams = (
    comparator: string,
    values: (string | ValueTypePair)[],
    negate: boolean,
    commentComparator?: string
) => {
    const unescapedValues = values.map(unescapeVariables).filter(isTruthy);

    if (commentComparator === ConditionComparator.STARTS || commentComparator === ConditionComparator.ENDS) {
        if (comparator !== 'Matches') {
            throw new Error(`Comment and computed comparator incompatible: ${comparator} instead of matches`);
        }

        const values = unescapedValues.map((value) => {
            const unescaped = unescapeCharacters(value);
            if (commentComparator === 'ends') {
                return unescaped.slice(1);
            }
            return unescaped.slice(0, -1);
        });

        return {
            Comparator: buildSimpleComparator(commentComparator[0].toUpperCase() + commentComparator.slice(1), negate),
            Values: values,
        };
    }

    if (commentComparator && comparator.toLowerCase() !== commentComparator) {
        // commentComparator is not required
        throw new Error(`Comment and computed comparator incompatible: ${comparator} instead of ${commentComparator}`);
    }

    return {
        Comparator: buildSimpleComparator(comparator, negate),
        Values: unescapedValues,
    };
};

/**
 * Parses the comparator comment, to retrieve the expected comparators.
 */
export const parseComparatorComment = (comparator?: ValueTextPair) => {
    if (!comparator) {
        return;
    }

    const text = comparator.Text;
    const chunks = text.split('\r\n *');

    const mapAnnotations = new Map([
        ['and', 'all'],
        ['or', 'any'],
    ]);

    const results: { comparators: string[]; type: string; errors: ValueTypePair[] } = {
        comparators: [],
        type: '',
        errors: [],
    };

    chunks.forEach((chunk) => {
        const res = chunk.match(/\s@(\w*)\s(.*)$/);
        if (res) {
            const [, annotationType, value] = res;

            if (annotationType === 'type') {
                const val = mapAnnotations.get(value);
                if (!val) {
                    results.errors.push({ Type: annotationType, Value: value });
                    return;
                }

                results.type = val;
            }

            if (annotationType === 'comparator') {
                results.comparators.push(value.replace('default', 'contains'));
                return;
            }
        }
    });

    if (results.errors.length) {
        throw new Error(
            `Unknown ${results.errors.reduce(
                (acc, { Type, Value }) => `${acc ? acc + ', ' : ''}${Type} "${Value}"`,
                ''
            )}`
        );
    }
    return results;
};

/**
 * Validate the tree and extracts the main node.
 */
export const extractMainNode = (tree: MainNodeType[]) => {
    const typed: {
        Set: ValueNamePair[];
        If: ItType[];
        Comment: ValueTextPair[];
        Require: { List: string[]; Type: string }[];
    } = tree.reduce(
        (acc, tree) => {
            const type = tree.Type;

            if (type && ['Require', 'If', 'Comment', 'Set'].includes(type)) {
                const typeKey = type as keyof typeof typed;
                const elt = [...(acc[typeKey] || []), tree];
                return { ...acc, [type]: elt };
            }
            return acc;
        },
        {
            Set: [],
            If: [],
            Comment: [],
            Require: [],
        }
    );

    if (Object.keys(typed).some((type) => !['Require', 'If', 'Comment', 'Set'].includes(type))) {
        throw new Error(`Invalid tree representation: Invalid node types.`);
    }

    if (typed.Set.filter(({ Value, Name }) => Value === '$' && Name === 'dollar').length !== typed.Set.length) {
        throw new Error(`Invalid tree representation: Invalid set node.`);
    }

    if (typed.If.length > 2) {
        throw new Error(`Invalid tree representation: too many if blocks`);
    }
    if (typed.Comment.length > 2) {
        throw new Error(`Invalid tree representation: too many comments blocks`);
    }

    const missingExtensions = typed.Require.reduce(
        (requiredExtensions, { List }) => {
            return requiredExtensions.filter((extension) => !List.includes(extension));
        },
        ['fileinto', 'imap4flags']
    );

    if (missingExtensions.length) {
        throw new Error('Invalid tree representation: requirements');
    }

    const mainNode = findLatest(typed.If, ({ If: ifBlock, Then: thenBlock }) => thenBlock && ifBlock && ifBlock.Tests);

    if (!mainNode) {
        throw new Error('Invalid tree representation');
    }

    const comment = findLatest(typed.Comment, async ({ Text }) =>
        Text.match(/^\/\*\*\r\n(?:\s\*\s@(?:type|comparator)[^\r]+\r\n)+\s\*\/$/)
    );

    return { comment, tree: mainNode };
};

/**
 * Parses the different ifs.
 */
export const parseIfConditions = (ifConditions: IfTest[], commentComparators?: string[]) => {
    const conditions = [];

    for (let index = 0; index < ifConditions.length; index++) {
        const { comparator: commentComparator, negate: commentNegate } = prepareComment(commentComparators?.[index]);
        const { element, negate } = prepareSingleCondition(ifConditions[index]);

        if (commentComparator && commentNegate !== negate) {
            throw new Error('Comment and computed negation incompatible');
        }

        const type = prepareType(element);

        const { Match, Keys: values = [] } = element || {};
        if (type !== 'attachments' && !Match) {
            throw new Error('Unsupported test');
        }

        const comparator = type === 'attachments' ? 'Contains' : Match.Type;
        const params = buildSimpleParams(comparator, values, negate, commentComparator);

        const typedKey = Object.keys(LABEL_KEYS).find((key) => key === type) as LABEL_KEY_TYPE | undefined;
        if (!typedKey) {
            throw new Error('Unsupported test');
        }

        conditions.push(buildSimpleCondition(typedKey, comparator, params));
    }

    return conditions;
};

/**
 * Parse the then nodes to extract the actions.
 */
export const parseThenNodes = (
    thenNodes: {
        Type: string;
        Name: string;
        Flags: string[];
        Message: string;
        Args: any[];
    }[]
) => {
    const actions: FilterActions = {
        FileInto: [],
        Mark: {
            Read: false,
            Starred: false,
        },
    };

    thenNodes.forEach((node) => {
        const type = node.Type;
        if (type === 'Keep') {
            //Nothing to do
        }

        if (type === 'Discard') {
            actions.FileInto.push('trash');
        }

        if (type === 'AddFlag') {
            actions.Mark = { Read: node.Flags.includes('\\Seen'), Starred: node.Flags.includes('\\Flagged') };
        }

        if (type === 'FileInto') {
            const { Name } = node;
            const unescapedName = unescapeVariables(Name);
            if (typeof unescapedName !== 'string') {
                throw new Error(`Unsupported string ${Name}`);
            }

            actions.FileInto.push(unescapedName);
        }

        if (type === 'Vacation') {
            const { Message } = node;
            const unescapedMessage = unescapeVariables(Message);
            if (typeof unescapedMessage !== 'string') {
                throw new Error(`Unsupported string ${Message}`);
            }
            actions.Vacation = unescapedMessage;
        }
    });

    return actions;
};
