import _ from 'lodash';

/* @ngInject */
function htmlToTextMail() {
    /*
         * HTML toPlaintext algorithm
         * The idea is to leverage the browser to do all the heavy lifting: we don't try to parse html to "test"
         * what a newline is and what is not.
         *
         * The basic idea is select all text -> copy to a variable -> :tada:
         *
         * Then we do want to convert <blockquote>html</blockquote> into the format:
         * > line1
         * > line2
         *
         * So what we do is we split the html into parts with blockquotes and parts with none
         * recursively get the plaintext in the blockquotes and add for each line a `>` in front of it
         *
         * Because we try to leverage the browser we mix the formatting and extraction part a bit.
         */

    const NEWLINE_REGEX = /(\r\n|\r|\n)/g;

    const afterPosition = (blockquote, { node, position }) => {
        const bitmask = node.compareDocumentPosition(blockquote);
        return bitmask & Node.DOCUMENT_POSITION_FOLLOWING && (position === 'before' || !(bitmask & Node.DOCUMENT_POSITION_CONTAINED_BY));
    };

    const UNORDERED_LIST_TYPE = ['circle', 'disc', 'square'];

    const getListIndex = (listNode, node) => {
        const listElements = [...listNode.childNodes];
        const startValue = listNode.start;

        // invert the step is listNode.reversed === false (false => 1, true => -1)
        const step = listNode.reversed * -2 + 1;
        const listBeforeNode = listElements.slice(0, listElements.indexOf(node) + 1);

        return _.reduce(listBeforeNode, (value, node) => (node.hasAttribute('value') ? node.value : value + step), startValue - step);
    };

    /**
     * Calculates the enumerator in front of the given li element. For instance, in the following html:
     * <ul>
     *     <li id="example1"> element 1 </li>
     *     <li id="example2"> element 2 </li>
     * </ul>
     *  calculating getEnumerator on $('#example1') or $('#example2') will both return ' - ' is ul is an unordered list
     * <ol start="50">
     *     <li id="example1"> element 1 </li>
     *     <li id="example2> element 2 </li>
     *     <li value="42" id="example3"> element 3 </li>
     * </ol>
     * calculating getEnumerator on $('#example1') gives '50.  a $('#example2') gives '51. ' and $('#example3') gives '42. '
     * The list-style-type as in roman/japanese etcetera is ignored except if it switches an ordered list to an unordered list.
     * @param node
     * @returns string
     */
    const getEnumerator = (node) => {
        const listNode = node.parentNode;
        const listStyle = window.getComputedStyle(listNode);
        if (listStyle['list-style-image'] !== 'none' || UNORDERED_LIST_TYPE.includes(listStyle['list-style-type'])) {
            return ' - ';
        }

        return getListIndex(listNode, node) + '. ';
    };

    /**
     * A mapping of selectors to a process function that transforms the selected element into plaintext. A matchesTag
     * function is also included for performance reasons (avoids having to use the selector to check if a node matches the selector).
     */
    const LAYOUT_TAG = {
        blockquote: {
            process(editor, node) {
                return '>' + extractPlainText(editor, node).replace(NEWLINE_REGEX, '$1>');
            },
            matchesTag: (node) => node.tagName === 'BLOCKQUOTE'
        },
        'ol > li, ul > li': {
            process(editor, node) {
                return getEnumerator(node) + extractPlainText(editor, node);
            },
            matchesTag: (node) => node.tagName === 'LI' && ['OL', 'UL'].includes(node.parentNode.tagName)
        },
        'p:not(:last-child), h1:not(:last-child), h2:not(:last-child), h3:not(:last-child), h4:not(:last-child), h5:not(:last-child), h6:not(:last-child)': {
            process(editor, node) {
                return extractPlainText(editor, node) + '\n';
            },
            matchesTag: (node) => ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(node.tagName) && node.nextElementSibling !== null
        },
        '.protonmail_signature_block': {
            process(editor, node) {
                /*
                        Add empty space unicode around it to allow us
                        to replace the signature if we change the From
                     */
                return `\u200B${extractPlainText(editor, node)}\u200B\n`;
            },
            matchesTag: (node) => node.tagName === 'DIV' && node.classList.contains('protonmail_signature_block')
        }
    };

    const ALL_TAGS_SELECTOR = _.keys(LAYOUT_TAG).join(',');

    /**
     * Gets the first element that needs to be processed in a different way than just selecting the text and copying it.
     * @param node The node from where to start searching for a layout tag
     * @param position Whether to start searching in the node (before) or after the element (after)
     * @returns {{nextNode, process}}
     */
    const getLayoutTagAfter = (node, position) => {
        const tags = node.querySelectorAll(ALL_TAGS_SELECTOR);
        const nextNode = _.find(tags, (tag) => afterPosition(tag, position));

        if (angular.isUndefined(nextNode)) {
            return { nextNode, process: angular.noop };
        }

        // assumption each node can only be one tag (should hold as layout tags can only be tags and not classes)
        const tagType = _.find(_.keys(LAYOUT_TAG), (tag) => LAYOUT_TAG[tag].matchesTag(nextNode));

        const process = LAYOUT_TAG[tagType].process;

        return { nextNode, process };
    };

    /**
     * Extracts the plaintext value of a node by selecting the whole node in the browser and copying the text.
     * @param editor
     * @param start
     * @param end
     * @returns {*}
     */
    const extractPlainTextSimple = (editor, start, end) => {
        const selection = editor.getSelection();
        const range = document.createRange();

        if (start.position === 'after') {
            range.setStartAfter(start.node);
        } else {
            range.setStartBefore(start.node);
        }

        if (end.position === 'after') {
            range.setEndAfter(end.node);
        } else {
            range.setEndBefore(end.node);
        }

        editor.setSelection(range);
        const result = editor.getSelectedText();
        editor.setSelection(selection);

        return /\n$/.test(result) ? result : `${result}\n`;
    };

    /**
     * The main function that extracts the plaintext from a given node. It uses the LAYOUT_TAG map using
     * getLayoutTagAfter to process special nodes in a different way. The default way of converting a node
     * to plaintext is done by selecting the text in the editor and copying the text. This is implemented in
     * extractPlainTextSimple.
     * function as we need to call extractPlainText before it is defined (cyclic dependency)
     * @param editor
     * @param node
     * @returns {string}
     */
    function extractPlainText(editor, node) {
        const startPosition = { node, position: 'before' };
        const endPosition = { node, position: 'after' };

        // loop over all blockquotes so we can add '>' in front of them
        const stringList = [];

        let currentPosition = startPosition;
        let layoutTag = getLayoutTagAfter(node, currentPosition);

        while (layoutTag.nextNode) {
            // condition: we have processed until currentPosition
            stringList.push(extractPlainTextSimple(editor, currentPosition, { node: layoutTag.nextNode, position: 'before' }));
            stringList.push(layoutTag.process(editor, layoutTag.nextNode, extractPlainText));

            currentPosition = { node: layoutTag.nextNode, position: 'after' };
            layoutTag = getLayoutTagAfter(node, currentPosition);
        }

        stringList.push(extractPlainTextSimple(editor, currentPosition, endPosition));

        return stringList.join('');
    }

    const toPlaintext = (editor) => {
        const root = editor.getRoot();
        return extractPlainText(editor, root);
    };

    return toPlaintext;
}
export default htmlToTextMail;
