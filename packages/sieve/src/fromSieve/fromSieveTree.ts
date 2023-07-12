import invert from 'lodash/invert';

import { FilterCondition, FilterStatement, SimpleObject } from '@proton/components/containers/filters/interfaces';

import { LABEL_KEYS, OPERATOR_KEYS } from '../interface';
import { extractMainNode, parseComparatorComment, parseIfConditions, parseThenNodes } from './fromSieveTree.helpers';

/**
 * Transforms a tree into a simple representation.
 */
export const fromSieveTree = (tree: any): SimpleObject | undefined => {
    try {
        const validated = extractMainNode(tree);
        const validatedTree = Object.assign(validated.tree, {});
        const comment = parseComparatorComment(validated.comment);
        const operator = invert(OPERATOR_KEYS)[validatedTree.If.Type];

        if (comment && comment.type && operator !== comment.type) {
            throw new Error('Comment and computed type incompatible');
        }

        const conditions = parseIfConditions(
            validatedTree.If.Tests,
            comment && comment.comparators
        ) as FilterCondition[];

        return {
            Operator: {
                label: operator === 'all' ? LABEL_KEYS.all : LABEL_KEYS.any,
                value: operator === 'all' ? FilterStatement.ALL : FilterStatement.ANY,
            },
            Conditions: [...conditions],
            Actions: parseThenNodes(validatedTree.Then),
        };
    } catch (e) {
        return undefined;
    }
};
