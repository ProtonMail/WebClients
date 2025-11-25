export const convertSubjectAreaToSubjectCoordinates = (subjectArea: number[]) => {
    if (subjectArea.length === 2) {
        const [x, y] = subjectArea;
        return { Top: y, Left: x, Bottom: y, Right: x };
    } else if (subjectArea.length === 3) {
        const [x, y, diameter] = subjectArea;
        const radius = Math.floor(diameter / 2);
        return { Top: y - radius, Left: x - radius, Bottom: y + radius, Right: x + radius };
    } else if (subjectArea.length === 4) {
        const [x, y, width, height] = subjectArea;
        const middleHeight = Math.floor(height / 2);
        const middleWidth = Math.floor(width / 2);
        return { Top: y - middleHeight, Left: x - middleWidth, Bottom: y + middleHeight, Right: x + middleWidth };
    }

    throw new Error('Invalid exif SubjectArea was passed');
};
