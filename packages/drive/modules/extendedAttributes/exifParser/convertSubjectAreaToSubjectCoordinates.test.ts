import { convertSubjectAreaToSubjectCoordinates } from './convertSubjectAreaToSubjectCoordinates';

describe('convertSubjectAreaToSubjectCoordinates()', () => {
    it("should correctly convert exif's SubjectArea with X,Y to SubjectCoordinates", () => {
        const subjectArea = [232, 643];
        expect(convertSubjectAreaToSubjectCoordinates(subjectArea)).toEqual({
            Top: 643,
            Left: 232,
            Bottom: 643,
            Right: 232,
        });
    });
    it("should correctly convert exif's SubjectArea with X,Y,Diameter to SubjectCoordinates", () => {
        const subjectArea = [232, 643, 142];
        expect(convertSubjectAreaToSubjectCoordinates(subjectArea)).toEqual({
            Top: 572,
            Left: 161,
            Bottom: 714,
            Right: 303,
        });
    });
    it("should correctly convert exif's SubjectArea X,Y,Width,Height to SubjectCoordinates", () => {
        const subjectArea = [232, 643, 142, 432];
        expect(convertSubjectAreaToSubjectCoordinates(subjectArea)).toEqual({
            Top: 427,
            Left: 161,
            Bottom: 859,
            Right: 303,
        });
    });
});
