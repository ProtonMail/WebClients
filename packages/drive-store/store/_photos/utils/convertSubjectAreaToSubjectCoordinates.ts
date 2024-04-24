export const convertSubjectAreaToSubjectCoordinates = (subjectArea: number[]) => {
    if (subjectArea.length === 2) {
        // Case: X, Y
        const [x, y] = subjectArea;
        return { top: y, left: x, bottom: y, right: x };
    } else if (subjectArea.length === 3) {
        // Case: X, Y, Diameter
        const [x, y, diameter] = subjectArea;
        const radius = Math.floor(diameter / 2);
        return { top: y - radius, left: x - radius, bottom: y + radius, right: x + radius };
    } else if (subjectArea.length === 4) {
        // Case: X, Y, Width, Length
        const [x, y, width, height] = subjectArea;
        const middleHeight = Math.floor(height / 2);
        const middleWidth = Math.floor(width / 2);
        return { top: y - middleHeight, left: x - middleWidth, bottom: y + middleHeight, right: x + middleWidth };
    }

    // Invalid subject area format
    throw new Error('Invalid exif SubjectArea was passed');
};
