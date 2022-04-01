import { DIACRITICS_REGEXP, ES_MAX_INITIAL_CHARS } from './constants';
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
const findLigatures = (text: string, nfkd: string): [number, number][] => {
    const nfd = normalizeString(text, 'NFD');

    if (nfd.length === nfkd.length) {
        return [];
    }

    const result: [number, number][] = [];
    for (let i = 0; i < nfd.length; i++) {
        if (!nfkd.includes(nfd[i], i)) {
            result.push([i, normalizeString(nfd[i], 'NFKD').length]);
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
const nfkdToNFD = (ligatures: [number, number][], index: number) => {
    for (let l = 0; l < ligatures.length; l++) {
        if (index > ligatures[l][0]) {
            if (index >= ligatures[l][1]) {
                index -= ligatures[l][1] - 1;
            } else {
                return ligatures[l][0];
            }
        } else {
            break;
        }
    }
    return index;
};

/**
 * Convert an index from the diacritics-free NFKD string to the original one
 */
const updateIndex = (diacritics: number[], ligatures: [number, number][], index: number) =>
    nfdToText(diacritics, nfkdToNFD(ligatures, index));

/**
 * Find occurrences of a keyword in a text
 */
const findOccurrences = (text: string, normalizedKeywords: string[]) => {
    const positions: [number, number][] = [];
    const diacritics = findDiacritics(text);
    const searchString = normalizeString(text);
    const ligatures = findLigatures(text, searchString);

    for (const keyword of normalizedKeywords) {
        let finder = 0;
        let startFrom = 0;
        while (finder !== -1) {
            finder = searchString.indexOf(keyword, startFrom);
            if (finder !== -1) {
                positions.push([
                    updateIndex(diacritics, ligatures, finder),
                    updateIndex(diacritics, ligatures, finder + keyword.length),
                ]);
                startFrom = finder + keyword.length;
            }
        }
    }

    return sanitisePositions(positions);
};

/**
 * Traverse an email's body to highlight only text within HTML tags
 */
const recursiveBodyTraversal = (node: Node, applySearchMarkup: (text: string) => HTMLSpanElement | undefined) => {
    if (node.nodeName === 'STYLE' || node.nodeName === 'SCRIPT') {
        return;
    }
    if (node.nodeName === '#text') {
        if (node.textContent) {
            const highlightedSpan = applySearchMarkup(node.textContent);
            if (highlightedSpan) {
                node.parentNode?.replaceChild(highlightedSpan, node);
            }
        }
        return;
    }
    for (const child of node.childNodes) {
        recursiveBodyTraversal(child, applySearchMarkup);
    }
};

/**
 * Insert the highlighting HTML tags inside a content given as a string
 */
export const insertMarks = (content: string, normalizedKeywords: string[], setAutoScroll: boolean) => {
    const domParser = new DOMParser();
    const html = domParser.parseFromString(content, 'text/html');

    const applySearchMarkup = (text: string) => {
        const sanitisedPositions = findOccurrences(text, normalizedKeywords);
        if (!sanitisedPositions.length) {
            return;
        }

        const span = html.createElement('span');

        let previousIndex = 0;
        for (const position of sanitisedPositions) {
            const oldPreviousIndex = previousIndex;
            [, previousIndex] = position;
            span.appendChild(html.createTextNode(text.slice(oldPreviousIndex, position[0])));
            const mark = html.createElement('mark');
            mark.setAttribute('class', 'proton-search-highlight');
            const markedText = html.createTextNode(text.slice(position[0], position[1]));
            mark.appendChild(markedText);
            span.appendChild(mark);
        }
        span.appendChild(html.createTextNode(text.slice(sanitisedPositions[sanitisedPositions.length - 1][1])));

        return span;
    };

    recursiveBodyTraversal(html.body, applySearchMarkup);

    if (setAutoScroll) {
        const marks = html.body.getElementsByClassName('proton-search-highlight');
        marks.item(0)?.setAttribute('data-auto-scroll', 'true');
    }

    return html.documentElement.outerHTML;
};

/**
 * Creates an element containing the highlighted email metadata
 */
export const highlightJSX = (
    metadata: string,
    normalizedKeywords: string[],
    isBold: boolean = false,
    trim: boolean = false
) => {
    const sanitisedPositions = findOccurrences(metadata, normalizedKeywords);

    if (!sanitisedPositions.length) {
        return {
            numOccurrences: 0,
            resultJSX: <span>{metadata}</span>,
        };
    }

    let previousIndex = 0;
    return {
        numOccurrences: sanitisedPositions.length,
        resultJSX: (
            <span>
                {sanitisedPositions.map((position, index) => {
                    const oldPreviousIndex = previousIndex;
                    [, previousIndex] = position;

                    // Find where to trim and avoid breaking words
                    const estimatedStartIndex = Math.max(0, position[0] - ES_MAX_INITIAL_CHARS);
                    let exactStartIndex = estimatedStartIndex;
                    if (estimatedStartIndex !== 0) {
                        const firstSpaceIndex = metadata.slice(estimatedStartIndex).indexOf(' ');
                        if (firstSpaceIndex !== -1) {
                            exactStartIndex = estimatedStartIndex + firstSpaceIndex + 1;
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
