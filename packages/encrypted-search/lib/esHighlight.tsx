import { removeDiacritics } from '@proton/shared/lib/helpers/string';
import { ES_MAX_INITIAL_CHARS } from './constants';

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
 * Find occurrences of a keyword in a text
 */
const findOccurrences = (text: string, normalizedKeywords: string[]) => {
    const positions: [number, number][] = [];
    const searchString = removeDiacritics(text.toLocaleLowerCase());
    for (const keyword of normalizedKeywords) {
        let finder = 0;
        let startFrom = 0;
        while (finder !== -1) {
            finder = searchString.indexOf(keyword, startFrom);
            if (finder !== -1) {
                positions.push([finder, finder + keyword.length]);
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
