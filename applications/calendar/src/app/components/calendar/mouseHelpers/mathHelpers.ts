/**
 * Returns a value between [0-1]
 */
export const getRelativePosition = (pagePosition: number, elementPosition: number, elementSize: number) => {
    return Math.min(Math.max(0, pagePosition - elementPosition), elementSize) / elementSize;
};

export const normalizeIndex = (i: number, length: number) => Math.min(i, length - 1);

export const getTargetIndex = (pagePosition: number, elementPosition: number, elementSize: number, total: number) => {
    return normalizeIndex(Math.floor(getRelativePosition(pagePosition, elementPosition, elementSize) * total), total);
};

export const toPercent = (float: number) => `${float * 100}%`;
