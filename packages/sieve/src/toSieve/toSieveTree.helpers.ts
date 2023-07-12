import {
    ConditionComparator,
    ConditionComparatorInvertedMap,
    ConditionType,
    FilterActions,
    FilterCondition,
    FilterStatement,
    SimpleObject,
} from '@proton/components/containers/filters/interfaces';

import { TEST_NODES, V1, V2 } from '../constants';
import { escapeCharacters, escapeVariables, unique } from '../helpers';
import {
    BuildFileIntoType,
    EscapeVariableType,
    MATCH_KEYS,
    OPERATOR_KEYS,
    SIEVE_VERSION,
    SieveCondition,
    ValueTypePair,
} from '../interface';

/**
 * Builds a vacation action.
 */
const buildVacationAction = (message: string | ValueTypePair, version: SIEVE_VERSION) => {
    return {
        Message: message,
        Args: { MIMEType: 'text/html' },
        Type: version === V1 ? 'Vacation\\Vacation' : 'Vacation',
    };
};

/**
 * Builds a setFlag action, for read or starred.
 */
const buildSetFlagThen = (read: boolean, starred: boolean) => {
    const flags = [];

    if (read) {
        flags.push('\\Seen');
    }

    if (starred) {
        flags.push('\\Flagged');
    }

    return {
        Flags: flags,
        Type: 'AddFlag',
    };
};

/**
 * Builds a require node.
 */
const buildSieveRequire = (requires: string[], mandatory: string[] = ['fileinto', 'imap4flags']) => {
    return {
        List: unique([...mandatory, ...requires]),
        Type: 'Require',
    };
};

/**
 * Builds a file into action.
 */
const buildFileIntoAction = (name: string | ValueTypePair) => {
    return {
        Name: name,
        Type: 'FileInto',
    };
};

/**
 * Build the comment node from a comparator.
 */
const buildComparatorComment = (comparators: string[], type: FilterStatement) => {
    const commentArray = ['/**'];

    if (OPERATOR_KEYS[type] === OPERATOR_KEYS.all) {
        commentArray.push(' @type and');
    } else if (OPERATOR_KEYS[type] === OPERATOR_KEYS.any) {
        commentArray.push(' @type or');
    }

    commentArray.push(...comparators.map((comparator) => ' @comparator ' + comparator));

    commentArray.push('/');
    return {
        Text: commentArray.join('\r\n *'),
        Type: 'Comment',
    };
};

/**
 * Builds an address test.
 */
const buildAddressTest = (headers: string[], keys: EscapeVariableType[], match: string) => {
    return {
        Headers: headers,
        Keys: keys,
        Match: {
            Type: match,
        },
        Format: {
            Type: 'UnicodeCaseMap',
        },
        Type: 'Address',
        AddressPart: {
            Type: 'All',
        },
    };
};

/**
 * Build match and values from comparator and condition.
 */
const buildMatchAndValues = (comparator: ConditionComparator, condition: { Values: string[] }) => {
    // starts and ends does not exists in sieve. Replacing it to match.
    const values = condition.Values.map((value) => {
        const escaped = escapeCharacters(value);
        if (comparator === ConditionComparator.STARTS) {
            return `${escaped}*`;
        }

        if (comparator === ConditionComparator.ENDS) {
            return `*${escaped}`;
        }

        return value;
    });

    let val = MATCH_KEYS.default;
    if (comparator === ConditionComparator.STARTS || comparator === ConditionComparator.ENDS) {
        val = MATCH_KEYS.matches;
    } else {
        val = MATCH_KEYS[comparator];
    }

    return {
        values,
        match: val ?? MATCH_KEYS.default ?? 'Defaults',
    };
};

/**
 * Builds a simple test.
 */
const buildSimpleHeaderTest = (headers: string[], keys: EscapeVariableType[], match: string) => {
    return {
        Headers: headers,
        Keys: keys,
        Match: {
            Type: match, // The value can be removed if needed, it's backend compatible.
        },
        Format: {
            Type: 'UnicodeCaseMap',
        },
        Type: 'Header',
    };
};

/**
 * Prepare comparator.
 */
const prepareComparator = (comparator: ConditionComparator) => {
    const mappedCondition = ConditionComparatorInvertedMap.get(comparator);
    if (mappedCondition) {
        return {
            negate: true,
            comparator: mappedCondition,
        };
    }

    return {
        negate: false,
        comparator,
    };
};

/**
 * Negates a given test.
 */
const buildTestNegate = <T>(test: T) => {
    return {
        Test: test,
        Type: 'Not',
    };
};

/**
 * Prepare the comment.
 */
const prepareComment = (comparator: string, type: string, negate: boolean) => {
    const negation = negate ? '!' : '';
    if (type === 'attachments') {
        return `${negation}default`;
    }
    return `${negation}${comparator}`;
};

/**
 * Builds mark blocks.
 */
export const buildMark = ({ Read: read, Starred: starred }: { Read: boolean; Starred: boolean }) => {
    if (!read && !starred) {
        return { blocks: [] };
    }

    return { blocks: [buildSetFlagThen(read, starred), { Type: 'Keep' }] };
};

/**
 * Build vacation blocks.
 */
export const buildVacation = (vacation: string | null | undefined, version: SIEVE_VERSION) => {
    if (!vacation) {
        return { blocks: [] };
    }

    const message = escapeVariables(vacation);
    return {
        blocks: [buildVacationAction(message, version)],
        dollarNeeded: typeof message === 'object',
    };
};

/**
 * Builds the tree.
 */
export const buildBasicTree = (
    parameters: {
        requires: string[];
        comparators: string[];
        type: FilterStatement;
        tests: any;
        thens: any[];
        dollarNeeded?: boolean;
    },
    version: SIEVE_VERSION
) => {
    const treeStructure = [];
    if (version === V2) {
        treeStructure.push(
            buildSieveRequire(
                ['include', 'environment', 'variables', 'relational', 'comparator-i;ascii-numeric', 'spamtest'],
                []
            )
        );
    }

    treeStructure.push(buildSieveRequire(parameters.requires));

    if (version === V2) {
        treeStructure.push(...TEST_NODES.spamtest);

        if (parameters.dollarNeeded) {
            treeStructure.push(...TEST_NODES.dollar);
        }

        treeStructure.push(buildComparatorComment(parameters.comparators, parameters.type));
    }

    treeStructure.push({
        If: {
            Tests: parameters.tests,
            Type: OPERATOR_KEYS[parameters.type],
        },
        Then: parameters.thens,
        Type: 'If',
    });
    return treeStructure;
};

/**
 * Validates the received simple representation.
 */
export const validateSimpleRepresentation = (simple: SimpleObject) => {
    /* beware the not */
    if (!(simple.Operator instanceof Object && Array.isArray(simple.Conditions) && simple.Actions instanceof Object)) {
        throw new Error('Invalid simple data types');
    }

    if (!simple.Operator.label || !simple.Operator.value) {
        throw new Error('Invalid simple operator');
    }

    simple.Conditions.forEach((condition) => {
        if (!condition.Values) {
            throw new Error('Invalid simple conditions');
        }

        const { comparator } = prepareComparator(condition.Comparator.value);
        if (!MATCH_KEYS[comparator] || MATCH_KEYS[comparator] === MATCH_KEYS.default) {
            throw new Error('Unrecognized simple condition: ' + condition.Comparator.value);
        }
    });

    if (
        !simple.Actions.FileInto ||
        !Array.isArray(simple.Actions.FileInto) ||
        !simple.Actions.Mark ||
        simple.Actions.Mark.Read === undefined ||
        simple.Actions.Mark.Starred === undefined
    ) {
        throw new Error('Invalid simple actions');
    }

    return simple;
};

/**
 * Builds fileInto blocks.
 */
export const buildFileInto = (actions: FilterActions['FileInto']) => {
    const initialObject: {
        dollarNeeded: boolean;
        blocks: BuildFileIntoType[];
    } = {
        dollarNeeded: false,
        blocks: [],
    };

    actions.forEach((action) => {
        const formattedAction = escapeVariables(action);

        if (typeof formattedAction === 'object') {
            initialObject.dollarNeeded = true;
        }

        initialObject.blocks.push(buildFileIntoAction(formattedAction));
    });

    return initialObject;
};

//A bit hard to migrate
/**
 * Builds condition block.
 */
export const buildCondition = (conditions: FilterCondition[]): SieveCondition => {
    const initialObject: SieveCondition = {
        tests: [],
        comparators: [],
        dollarNeeded: false,
    };

    conditions.forEach((condition) => {
        const { comparator, negate } = prepareComparator(condition.Comparator.value);
        const { match, values: matchValues } = buildMatchAndValues(comparator, condition);

        const values = matchValues.map(escapeVariables);
        const conditionMap = {
            sender: () => buildAddressTest(['From'], values, match),
            recipient: () => buildAddressTest(['To', 'Cc', 'Bcc'], values, match),
            subject: () => buildSimpleHeaderTest(['Subject'], values, match),
            attachments: () => TEST_NODES.attachment[0],
        };
        const conditionMapping = new Map([
            [ConditionType.SENDER, conditionMap.sender],
            [ConditionType.RECIPIENT, conditionMap.recipient],
            [ConditionType.SUBJECT, conditionMap.subject],
            [ConditionType.ATTACHMENTS, conditionMap.attachments],
        ]);

        const mappedCondition = conditionMapping.get(condition.Type.value);
        if (mappedCondition) {
            const test = mappedCondition();
            initialObject.tests.push(negate ? buildTestNegate(test) : test);
        }

        initialObject.dollarNeeded = values.some((value) => typeof value !== 'string');
        initialObject.comparators.push(prepareComment(comparator, condition.Type.value, negate));
    });

    return initialObject;
};
