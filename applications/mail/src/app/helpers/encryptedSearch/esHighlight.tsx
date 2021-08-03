import { ReactNode } from 'react';
import { classnames } from '@proton/components';
import { HighlightMetadata } from '../../models/encryptedSearch';
import { ES_MAX_INITIAL_CHARS } from '../../constants';

/**
 * Traverse an email's body to highlight only text within HTML tags
 */
const recursiveBodyTraversal = (node: Node, applySearchMarkup: (text: string) => HTMLSpanElement | undefined) => {
    if (node.nodeName === 'STYLE') {
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
 * Removes overlapping intervals to highlight
 */
export const sanitisePositions = (positions: [number, number][]) => {
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
export const findOccurrences = (text: string, normalisedKeywords: string[]) => {
    const positions: [number, number][] = [];
    const searchString = text.toLocaleLowerCase();
    for (const keyword of normalisedKeywords) {
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
 * Insert the highlighting HTML tags inside the body of an email
 */
export const insertMarks = (content: string, normalisedKeywords: string[], setAutoScroll: boolean) => {
    const domParser = new DOMParser();
    const html = domParser.parseFromString(content, 'text/html');

    const applySearchMarkup = (text: string) => {
        const sanitisedPositions = findOccurrences(text, normalisedKeywords);
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
            const markedText = html.createTextNode(text.slice(position[0], position[1]));
            mark.appendChild(markedText);
            span.appendChild(mark);
        }
        span.appendChild(html.createTextNode(text.slice(sanitisedPositions[sanitisedPositions.length - 1][1])));

        return span;
    };

    recursiveBodyTraversal(html.body, applySearchMarkup);

    if (setAutoScroll) {
        const marks = html.body.getElementsByTagName('mark');
        marks.item(0)?.setAttribute('data-auto-scroll', 'true');
    }

    return html.documentElement.outerHTML;
};

/**
 * Creates an element containing the highlighted email metadata
 */
export const highlightJSX = (
    metadata: string,
    normalisedKeywords: string[],
    isBold: boolean = false,
    trim: boolean = false
) => {
    const sanitisedPositions = findOccurrences(metadata, normalisedKeywords);

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
                    const startingCharIndex = Math.max(0, position[0] - ES_MAX_INITIAL_CHARS);
                    const startingSlice =
                        index === 0 && trim
                            ? `${startingCharIndex !== 0 ? '…' : ''}${metadata.slice(startingCharIndex, position[0])}`
                            : metadata.slice(oldPreviousIndex, position[0]);
                    return (
                        <span
                            key={index} // eslint-disable-line react/no-array-index-key
                        >
                            {startingSlice}
                            <mark className={classnames([isBold && 'text-bold'])}>
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
