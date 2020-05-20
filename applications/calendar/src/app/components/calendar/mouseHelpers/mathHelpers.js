/**
 * Returns a value between [0-1]
 * @param {number} pagePosition
 * @param {number} elementPosition
 * @param {number} elementSize
 * @return {number}
 */
export const getRelativePosition = (pagePosition, elementPosition, elementSize) => {
    return Math.min(Math.max(0, pagePosition - elementPosition), elementSize) / elementSize;
};

export const normalizeIndex = (i, length) => Math.min(i, length - 1);

export const getTargetIndex = (pagePosition, elementPosition, elementSize, total) => {
    return normalizeIndex(Math.floor(getRelativePosition(pagePosition, elementPosition, elementSize) * total), total);
};

export const toPercent = (float) => `${float * 100}%`;
