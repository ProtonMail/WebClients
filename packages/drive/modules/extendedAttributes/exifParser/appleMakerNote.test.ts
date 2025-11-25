import { detectPortraitFromMakerNote, detectSelfieFromMakerNote, isAppleMakerNote } from './appleMakerNote';

describe('isAppleMakerNote', () => {
    test('should return undefined for null input', () => {
        expect(isAppleMakerNote(null)).toBeUndefined();
    });

    test('should return undefined for undefined input', () => {
        expect(isAppleMakerNote(undefined)).toBeUndefined();
    });

    test('should return undefined for non-object input', () => {
        expect(isAppleMakerNote('not an object')).toBeUndefined();
        expect(isAppleMakerNote(123)).toBeUndefined();
    });

    test('should return undefined for object without value property', () => {
        expect(isAppleMakerNote({})).toBeUndefined();
        expect(isAppleMakerNote({ notValue: [] })).toBeUndefined();
    });

    test('should return undefined for object with value property that has no length', () => {
        expect(isAppleMakerNote({ value: {} })).toBeUndefined();
        expect(isAppleMakerNote({ value: 123 })).toBeUndefined();
    });

    test('should correctly convert Uint8Array input', () => {
        const input = { value: new Uint8Array([1, 2, 3]) };
        const result = isAppleMakerNote(input);
        expect(result).toBeInstanceOf(Uint8Array);
        expect(Array.from(result || [])).toEqual([1, 2, 3]);
    });

    test('should correctly convert ArrayBuffer input', () => {
        const buffer = new ArrayBuffer(3);
        const view = new Uint8Array(buffer);
        view[0] = 1;
        view[1] = 2;
        view[2] = 3;

        const input = { value: buffer };
        const result = isAppleMakerNote(input);
        expect(result).toBeInstanceOf(Uint8Array);
        expect(Array.from(result || [])).toEqual([1, 2, 3]);
    });

    test('should correctly convert Array input', () => {
        const input = { value: [1, 2, 3] };
        const result = isAppleMakerNote(input);
        expect(result).toBeInstanceOf(Uint8Array);
        expect(Array.from(result || [])).toEqual([1, 2, 3]);
    });

    test('should handle conversion errors gracefully', () => {
        const badInput = {
            value: {
                length: 3,
                get 0() {
                    throw new Error('Error');
                },
            },
        };

        expect(isAppleMakerNote(badInput)).toBeUndefined();
    });
});

describe('detectSelfieFromMakerNote', () => {
    test('should return false for undefined input', () => {
        expect(detectSelfieFromMakerNote(undefined)).toBe(false);
    });

    test('should return false for too short input', () => {
        expect(detectSelfieFromMakerNote(new Uint8Array([1, 2, 3]))).toBe(false);
    });

    test('should return false for non-Apple format', () => {
        const nonAppleData = new Uint8Array(30);
        nonAppleData.fill(0);
        expect(detectSelfieFromMakerNote(nonAppleData)).toBe(false);
    });

    test('should return false for Apple format with back camera (wide angle)', () => {
        const data = createMockAppleMakerNote(0);
        expect(detectSelfieFromMakerNote(data)).toBe(false);
    });

    test('should return false for Apple format with back camera (normal)', () => {
        const data = createMockAppleMakerNote(1);
        expect(detectSelfieFromMakerNote(data)).toBe(false);
    });

    test('should return true for Apple format with front camera', () => {
        const data = createMockAppleMakerNote(6);
        expect(detectSelfieFromMakerNote(data)).toBe(true);
    });

    test('should handle big endian format correctly', () => {
        const data = createMockAppleMakerNote(6);
        expect(detectSelfieFromMakerNote(data)).toBe(true);
    });
});

describe('detectPortraitFromMakerNote', () => {
    test('should return false for undefined input', () => {
        expect(detectPortraitFromMakerNote(undefined)).toBe(false);
    });

    test('should return false for too short input', () => {
        expect(detectPortraitFromMakerNote(new Uint8Array([1, 2, 3]))).toBe(false);
    });

    test('should return false for non-Apple format', () => {
        const nonAppleData = new Uint8Array(30);
        nonAppleData.fill(0);
        expect(detectPortraitFromMakerNote(nonAppleData)).toBe(false);
    });

    test('should return true for Apple format with Portrait mode', () => {
        const data = createMockAppleMakerNoteWithCaptureType(2);
        expect(detectPortraitFromMakerNote(data)).toBe(true);
    });

    test('should return false for Apple format with Photo mode', () => {
        const data = createMockAppleMakerNoteWithCaptureType(10);
        expect(detectPortraitFromMakerNote(data)).toBe(false);
    });

    test('should return false for Apple format with ProRAW mode', () => {
        const data = createMockAppleMakerNoteWithCaptureType(1);
        expect(detectPortraitFromMakerNote(data)).toBe(false);
    });

    test('should return false when capture type tag is not found', () => {
        const data = new Uint8Array(100);
        data.set([65, 112, 112, 108, 101]);
        expect(detectPortraitFromMakerNote(data)).toBe(false);
    });
});

function createMockAppleMakerNote(cameraType: number) {
    const data = new Uint8Array(100);

    data[0] = 65;
    data[1] = 112;
    data[2] = 112;
    data[3] = 108;
    data[4] = 101;

    data[10] = 77;
    data[11] = 77;

    const tagPos = 20;

    data[tagPos] = 0x00;
    data[tagPos + 1] = 0x2e;

    data[tagPos + 2] = 0x00;
    data[tagPos + 3] = 0x09;

    data[tagPos + 4] = 0x00;
    data[tagPos + 5] = 0x00;
    data[tagPos + 6] = 0x00;
    data[tagPos + 7] = 0x01;

    data[tagPos + 8] = 0x00;
    data[tagPos + 9] = 0x00;
    data[tagPos + 10] = 0x00;
    data[tagPos + 11] = cameraType;

    return data;
}

function createMockAppleMakerNoteWithCaptureType(captureType: number) {
    const data = new Uint8Array(100);

    data[0] = 65;
    data[1] = 112;
    data[2] = 112;
    data[3] = 108;
    data[4] = 101;

    const tagPos = 20;

    data[tagPos] = 0x00;
    data[tagPos + 1] = 0x14;

    data[tagPos + 2] = 0x00;
    data[tagPos + 3] = 0x09;
    data[tagPos + 4] = 0x00;
    data[tagPos + 5] = 0x00;
    data[tagPos + 6] = 0x00;
    data[tagPos + 7] = 0x01;

    data[tagPos + 8] = 0x00;
    data[tagPos + 9] = 0x00;
    data[tagPos + 10] = 0x00;
    data[tagPos + 11] = captureType;

    return data;
}
