import { ReactNode } from 'react';

import { parseStringToDOM } from '@proton/shared/lib/helpers/dom';

import { DIACRITICS_REGEXP, ES_MAX_INITIAL_CHARS } from '../constants';
import { HighlightMetadata } from '../models';
import { esSentryReport } from './esAPI';
import { normalizeString } from './esUtils';

/**
 * Removes overlapping intervals to highlight
 */
const sanitisePositions = (positions: [number, number][]) => {
    if (positions.length < 2) {
        return positions;
    }

    positions.sort((position1, position2) => position1[0] - position2[0]);

    const result = [];
    let previousValue = positions[0];
    for (let i = 1; i < positions.length; i += 1) {
        if (previousValue[1] >= positions[i][0]) {
            previousValue = [previousValue[0], Math.max(previousValue[1], positions[i][1])];
        } else {
            result.push(previousValue);
            previousValue = positions[i];
        }
    }
    result.push(previousValue);

    return result;
};

/**
 * List the indexes of all ligatures, as well as to how many
 * characters they split to after a NFKD transformation
 */
const findLigatures = (text: string, normalNFKD: string): [number, number][] => {
    const normalNFD = normalizeString(text, 'NFD');
    if (normalNFD.length === normalNFKD.length) {
        return [];
    }

    const result: [number, number][] = [];
    for (let i = 0; i < normalNFD.length; i++) {
        if (!normalNFKD.includes(normalNFD[i], i)) {
            result.push([i, normalizeString(normalNFD[i], 'NFKD').length]);
        }
    }

    return result;
};

/**
 * List the indexes of all diacritics
 */
const findDiacritics = (text: string) => Array.from(text.matchAll(DIACRITICS_REGEXP), (match) => match.index!);

/**
 * Convert an index from the diacritics-free NFD string to the original one
 */
const nfdToText = (diacritics: number[], index: number) => {
    for (let d = 0; d < diacritics.length; d++) {
        if (index >= diacritics[d]) {
            index++;
        } else {
            break;
        }
    }
    return index;
};

/**
 * Convert an index from the decomposed NFKD string to the potentially
 * more compact NFD representation, both diacritics-free
 */
const nfkdToNFD = (ligatures: [number, number][], index: number, isEnd: boolean) => {
    for (let l = 0; l < ligatures.length; l++) {
        if (index > ligatures[l][0]) {
            if (index >= ligatures[l][0] + ligatures[l][1]) {
                index -= ligatures[l][1] - 1;
            } else {
                return ligatures[l][0] + (isEnd ? 1 : 0);
            }
        } else {
            break;
        }
    }
    return index;
};

/**
 * Convert a start index from the diacritics-free NFKD string to the original one
 */
const updateStartIndex = (diacritics: number[], ligatures: [number, number][], index: number) =>
    nfdToText(diacritics, nfkdToNFD(ligatures, index, false));

/**
 * Convert an end index from the diacritics-free NFKD string to the original one
 */
const updateEndIndex = (diacritics: number[], ligatures: [number, number][], index: number) =>
    nfdToText(diacritics, nfkdToNFD(ligatures, index, true));

/**
 * Find occurrences of the given keywords in the raw text. It returns a list
 * of couples where the first element is the index where the match starts, while
 * the second is the index where the match ends (inclusive). Indexes refer to the
 * input raw text. Matching intervals are sanitised in such a way that they are
 * non-overlapping
 */
const findOccurrences = (rawText: string, normalizedKeywords: string[]) => {
    const searchText = normalizeString(rawText);
    const diacritics = findDiacritics(rawText);
    const ligatures = findLigatures(rawText, searchText);

    const positions: [number, number][] = [];
    for (const keyword of normalizedKeywords) {
        let finder = 0;
        let startFrom = 0;
        while (finder !== -1) {
            finder = searchText.indexOf(keyword, startFrom);
            if (finder !== -1) {
                // Each occurrence is represented as a [start, end) couple
                // of indexes, i.e. the start is inclusive while the end is not
                positions.push([
                    updateStartIndex(diacritics, ligatures, finder),
                    updateEndIndex(diacritics, ligatures, finder + keyword.length),
                ]);
                startFrom = finder + keyword.length;
            }
        }
    }

    // These represent the start indexes and end indexes (inclusive)
    // of all text to highlight, with reference to the index numbering
    // of the raw text
    return sanitisePositions(positions);
};

/**
 * Check whether the current node is not visibile, either because it's
 * a script or style node, or because of its CSS properties
 */
const isInvisibileNode = (node: Node) => {
    const { nodeName, nodeType } = node;
    const isHidden =
        nodeType === Node.ELEMENT_NODE
            ? (node as HTMLElement).style.display === 'none' || (node as HTMLElement).style.visibility === 'hidden'
            : false;
    return nodeName === 'STYLE' || nodeName === 'SCRIPT' || isHidden;
};

/**
 * Insert the highlighting HTML tags inside a parsed HTML document
 */
const insertMarksKeywords = (html: Document, normalizedKeywords: string[]) => {
    const rawText = (html.body.textContent || '').toLocaleLowerCase();
    const sanitisedPositions = findOccurrences(rawText, normalizedKeywords);

    // If no occurrences are found, simply don't insert anything
    if (!sanitisedPositions.length) {
        return;
    }

    // Stack to perform a DFS of the DOM tree
    const tempStack: Node[] = [html.body];
    // Stack to keep track of nodes in reverse order
    const nodeStack: Node[] = [];
    // Map to keep track of invisibile nodes' positions in the
    // node stack and their text content's length
    const tempInvisibileNodes: Map<number, number> = new Map();

    // Post-order tree traversal
    while (tempStack.length) {
        const node = tempStack.shift();
        if (!node) {
            continue;
        }
        nodeStack.unshift(node);
        // Invisible nodes are added to the stack such that
        // their text content length can be accounted for while
        // traversing the tree, but their children are not added
        // to the node stack, otherwise they will be visited
        if (isInvisibileNode(node)) {
            tempInvisibileNodes.set(nodeStack.length, (node.textContent || '').length);
        } else if (node.childNodes.length) {
            tempStack.unshift(...node.childNodes);
        }
    }

    // Re-adjust invisibile nodes' indexes based on the number of unshifts
    const invisibileNodes: Map<number, number> = new Map();
    tempInvisibileNodes.forEach((value, key) => {
        invisibileNodes.set(nodeStack.length - key, value);
    });

    // Initialisation of the range to highlight the keyword
    // even if it spans multiple tags. It has to be reset at
    // every instance of the keyword
    const range = html.createRange();
    // Counter to keep track of how many characters have been
    // "visisted", i.e. how far along the textContet we are,
    // in reverse order
    let charCount = rawText.length;

    const getNumContainedIndexes = (nodeLength: number, charCount: number) =>
        sanitisedPositions.filter(
            ([startIndex, endIndex]) =>
                // Whether the match starts in the node
                (startIndex >= charCount && startIndex <= charCount + nodeLength) ||
                // Whether the match ends in the node
                (endIndex >= charCount && endIndex <= charCount + nodeLength) ||
                // Edge case: whether the node is fully contained within the match
                (charCount >= startIndex &&
                    charCount <= endIndex &&
                    charCount + nodeLength >= startIndex &&
                    charCount + nodeLength <= endIndex)
        );

    const insertMarkTag = (range: Range) => {
        const markNode = document.createElement('mark');
        markNode.setAttribute('class', 'proton-search-highlight');
        markNode.appendChild(range.extractContents());
        range.insertNode(markNode);
    };

    for (let n = 0; n < nodeStack.length; n++) {
        const node = nodeStack[n];
        const { nodeName, textContent } = node;

        // We don't want to accidentally insert mark tags inside invisible nodes,
        // yet the char count needs to be updated for consistency
        const invisibleLength = invisibileNodes.get(n);
        if (invisibleLength) {
            charCount -= invisibleLength;
            continue;
        }

        if (nodeName === '#text' && !!textContent) {
            // We set charCount to be the index of the beginning of the current
            // textual node
            const nodeLength = textContent.length;
            charCount -= nodeLength;

            // We check how many instances of the keyword start in the current node
            // and then we process them in reverse order
            const containedIndexes = getNumContainedIndexes(nodeLength, charCount).reverse();

            for (let i = 0; i < containedIndexes.length; i++) {
                const [startIndex, endIndex] = containedIndexes[i];

                // If the node is fully contained in the mark, we simply highlight it all
                if (
                    containedIndexes.length == 1 &&
                    charCount >= startIndex &&
                    charCount <= endIndex &&
                    charCount + nodeLength >= startIndex &&
                    charCount + nodeLength <= endIndex
                ) {
                    range.setStart(node, 0);
                    range.setEnd(node, nodeLength);
                    insertMarkTag(range);
                    continue;
                }

                // Since we traverse the node in reverse order, we set the end
                // of the range first
                if (charCount + nodeLength > endIndex) {
                    range.setEnd(node, endIndex - charCount);

                    // If this is the last position in the array of indexes,
                    // i.e. it's the first instance in the node, and the instance
                    // crosses the tag, we close the range at the start of the node.
                    // Even though ranges can handle crossing element boundaries,
                    // extracting such ranges can cause unexpected results
                    // (e.g. when it splits a paragraph in two).
                    if (i === containedIndexes.length - 1 && startIndex < charCount) {
                        range.setStart(node, 0);
                        insertMarkTag(range);
                    }
                }

                // Since we traverse the node in reverse order, we set the start
                // of the range second
                if (startIndex >= charCount) {
                    range.setStart(node, startIndex - charCount);

                    // If this is the first position in the array of indexes,
                    // i.e. it's the last instance in the node, and the instance
                    // crosses the tag, we open the range at this instane and close it at the end of the node.
                    // Even though ranges can handle crossing element boundaries,
                    // extracting such ranges can cause unexpected results
                    // (e.g. when it splits a paragraph in two).
                    if (i === 0 && endIndex >= charCount + nodeLength) {
                        range.setEnd(node, nodeLength);
                    }

                    insertMarkTag(range);
                }
            }
        }
    }
};

/**
 * Insert the highlighting HTML tags inside an HTML document given as a string
 */
export const insertMarks = (htmlContent: string, normalizedKeywords: string[], setAutoScroll: boolean) => {
    const html = parseStringToDOM(htmlContent);

    try {
        insertMarksKeywords(html, normalizedKeywords);
    } catch (error: any) {
        // There could be potential edge cases in the highlighting. In the
        // worst case we want to fail gracefully and only highlight partially
        void esSentryReport('insertMarksKeywords', { error });
    }

    if (setAutoScroll) {
        const marks = html.body.getElementsByClassName('proton-search-highlight');
        marks.item(0)?.setAttribute('data-auto-scroll', 'true');
    }

    return html.documentElement.outerHTML;
};

/**
 * Creates an element containing the highlighted email metadata
 */
export const highlightJSX = (metadata: string, keywords: string[], isBold: boolean = false, trim: boolean = false) => {
    const sanitisedPositions = findOccurrences(metadata, keywords);
    let previousIndex = 0;
    return {
        numOccurrences: sanitisedPositions.length,
        resultJSX: !sanitisedPositions.length ? (
            <span>{metadata}</span>
        ) : (
            <span>
                {sanitisedPositions.map((position, index) => {
                    const oldPreviousIndex = previousIndex;
                    previousIndex = position[1];

                    // Find where to trim and avoid breaking words
                    const estimatedStartIndex = Math.max(0, position[0] - ES_MAX_INITIAL_CHARS);
                    let exactStartIndex = estimatedStartIndex;
                    if (estimatedStartIndex !== 0) {
                        const firstSpaceIndex = metadata.slice(estimatedStartIndex).indexOf(' ');
                        if (firstSpaceIndex !== -1) {
                            // We add 1 to account for the position of the space,
                            // which we won't show at the beginning of the trimmed
                            // sentence
                            exactStartIndex += firstSpaceIndex + 1;
                        }
                    }

                    const startingSlice =
                        index === 0 && trim
                            ? `${exactStartIndex !== 0 ? '…' : ''}${metadata.slice(exactStartIndex, position[0])}`
                            : metadata.slice(oldPreviousIndex, position[0]);

                    return (
                        <span
                            key={index} // eslint-disable-line react/no-array-index-key
                        >
                            {startingSlice}
                            <mark className={`${isBold ? 'text-bold' : ''}`}>
                                {metadata.slice(position[0], position[1])}
                            </mark>
                            {index === sanitisedPositions.length - 1
                                ? metadata.slice(sanitisedPositions[sanitisedPositions.length - 1][1])
                                : null}
                        </span>
                    );
                })}
            </span>
        ),
    };
};

/**
 * Insert highlighting markers only if a ReactNode is a string or can be parsed as such
 * @param node the react node in which highlight has to be inserted
 * @param highlightMetadata the callback to the highlightMetadata function returned by the
 * ES library
 * @returns the highlighted node
 */
export const highlightNode = (node: ReactNode, highlightMetadata: HighlightMetadata) => {
    const nodeValue = node?.valueOf();
    if (typeof nodeValue === 'string') {
        return highlightMetadata(nodeValue).resultJSX;
    }
    if (
        !!nodeValue &&
        Object.prototype.isPrototypeOf.call(Object.prototype, nodeValue) &&
        Object.prototype.hasOwnProperty.call(nodeValue, 'props')
    ) {
        const { props } = nodeValue as { props: any };
        if (
            Object.prototype.isPrototypeOf.call(Object.prototype, props) &&
            Object.prototype.hasOwnProperty.call(props, 'children')
        ) {
            const { children } = props;
            if (Array.isArray(props.children) && children.every((child: any) => typeof child === 'string')) {
                return highlightMetadata(children.join('')).resultJSX;
            }
        }
    }
    return node;
};
