import { convertSubjectAreaToSubjectCoordinates } from './convertSubjectAreaToSubjectCoordinates';

describe('convertSubjectAreaToSubjectCoordinates()', () => {
    it("should correctly convert exif's SubjectArea with X,Y to SubjectCoordinates", () => {
        const subjectArea = [232, 643];
        expect(convertSubjectAreaToSubjectCoordinates(subjectArea)).toEqual({
            top: 643,
            left: 232,
            bottom: 643,
            right: 232,
        });
    });
    it("should correctly convert exif's SubjectArea with X,Y,Diameter to SubjectCoordinates", () => {
        const subjectArea = [232, 643, 142];
        expect(convertSubjectAreaToSubjectCoordinates(subjectArea)).toEqual({
            top: 572,
            left: 161,
            bottom: 714,
            right: 303,
        });
    });
    it("should correctly convert exif's SubjectArea X,Y,Width,Height to SubjectCoordinates", () => {
        const subjectArea = [232, 643, 142, 432];
        expect(convertSubjectAreaToSubjectCoordinates(subjectArea)).toEqual({
            top: 427,
            left: 161,
            bottom: 859,
            right: 303,
        });
    });
});
