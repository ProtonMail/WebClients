import { GENERAL_STOP_STRINGS } from './constants';

export function removeStopStrings(text: string, customStopStrings?: string[]) {
    customStopStrings ||= [];
    const stopStrings = [...GENERAL_STOP_STRINGS, ...customStopStrings];
    const leftMostStopIdx: number | undefined = stopStrings
        .map((s) => text.indexOf(s))
        .filter((idx) => idx >= 0)
        .reduce((minIdx, idx) => (minIdx === undefined ? idx : Math.min(minIdx, idx)), undefined as number | undefined);
    if (leftMostStopIdx !== undefined) {
        text = text.slice(0, leftMostStopIdx);
    }
    return text;
}

export function convertToDoubleNewlines(input: string, splitParagraphs: boolean = true): string {
    if (!splitParagraphs) {
        return input.replace(/\n{3,}/g, '\n\n');
    }
    const lines = input.split('\n');

    const paragraphs: string[][] = [];
    let paragraph: string[] = [];
    let inList = false; // we're currently in a list
    let listJustBegan = false; // marks that the next line will be a list

    for (const originalLine of lines) {
        const linePreserveStartSpace = originalLine.trimEnd();
        const line = originalLine.trim();
        if (!line) {
            paragraphs.push(paragraph);
            paragraph = [];
            continue;
        }
        const isListLine = /^(\d+[\.\)]|\-|\*|\•|[a-zA-Z][\.\)]) /.test(line);
        inList = isListLine || listJustBegan;
        // This is splitting the content in different paragraphs, but in some cases (like refine),
        // the content should already be formatted as expected, so we don't want to add extra spaces where not needed
        if (!inList && splitParagraphs) {
            paragraphs.push(paragraph);
            paragraph = [];
        }
        paragraph.push(inList ? linePreserveStartSpace : line);
        listJustBegan = line.endsWith(':');
    }
    if (paragraph) {
        paragraphs.push(paragraph);
    }

    return paragraphs
        .map((lines) => lines.join('\n'))
        .join('\n\n')
        .replace(/\n{3,}/g, '\n\n');
}
