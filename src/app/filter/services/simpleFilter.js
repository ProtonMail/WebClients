import _ from 'lodash';
import Sieve from 'sieve.js';

/* @ngInject */
function simpleFilter() {
    /**
     * Computes the simple representation of a filter.
     * @param {{Tree: Object, Version: Number}} filter
     * @return {Boolean|{}} false if undefined, simple object else.
     */
    const computeFromTree = (filter) => {
        const simple = Sieve.fromTree(filter.Tree);

        const fromSimple = Sieve.toTree(simple, filter.Version).filter(({ Type }) => Type !== 'Comment');
        const original = filter.Tree.filter(({ Type }) => Type !== 'Comment');

        return _.isEqual(fromSimple, original) && simple;
    };

    /**
     * Compute a tree from a simple representation.
     * @param {{Simple: Object, Version: Number}} filter
     * @return {Boolean|Array} false if undefined, the tree else.
     */
    const computeTree = ({ Simple, Version }) => Simple && Sieve.toTree(Simple, Version);

    return { computeFromTree, computeTree };
}

export default simpleFilter;
