import _ from 'lodash';
import Sieve from 'sieve.js';

/**
 * Template for Sieve scripts.
 * @type {{'2': String, '1': String=}} map between specific version and template.
 */
export const templates = {
    2: `require ["include", "environment", "variables", "relational", "comparator-i;ascii-numeric", "spamtest"];

# Generated: Do not run this script on spam messages
if allof (environment :matches "vnd.proton.spam-threshold" "*",
spamtest :value "ge" :comparator "i;ascii-numeric" "\${1}")
{
    return;
}


`
};

/**
 * Computes the simple representation of a filter.
 * @param {{Tree: Object, Version: Number}} filter
 * @return {Boolean|{}} false if undefined, simple object else.
 */
export const computeFromTree = (filter) => {
    const ignoreComment = ({ Type }) => Type !== 'Comment';
    const simple = Sieve.fromTree(filter.Tree);
    const fromSimple = Sieve.toTree(simple, filter.Version).filter(ignoreComment);
    const original = filter.Tree.filter(ignoreComment);
    return _.isEqual(fromSimple, original) && simple;
};

/**
 * Compute a tree from a simple representation.
 * @param {{Simple: Object, Version: Number}} filter
 * @return {Boolean|Array} false if undefined, the tree else.
 */
export const computeTree = ({ Simple, Version }) => Simple && Sieve.toTree(Simple, Version);

/**
 * Create normalization function for Sieve, to prevent some existing unicode
 * inside the code. Replace simili quotes with single/double.
 * @return {Function} (input:<String>):<String>
 */
export function normalize() {
    const SINGLE_QUOTE = "'";
    const DOUBLE_QUOTE = '"';
    const SINGLE_QUOTE_REGEXP = new RegExp(`[${['‹', '›', '‚', '‘', '‛', '’', '❛', '❜', '❮', '❯'].join('')}]`, 'g');
    const DOUBLE_QUOTE_REGEXP = new RegExp(
        `[${['«', '»', '„', '“', '‟', '”', '❝', '❞', '〝', '〞', '〟', '＂'].join('')}]`,
        'g'
    );

    return (value = '') => {
        if (SINGLE_QUOTE_REGEXP.test(value) || DOUBLE_QUOTE_REGEXP.test(value)) {
            return value.replace(SINGLE_QUOTE_REGEXP, SINGLE_QUOTE).replace(DOUBLE_QUOTE_REGEXP, DOUBLE_QUOTE);
        }
        return value;
    };
}
