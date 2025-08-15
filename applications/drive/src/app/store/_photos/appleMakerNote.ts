// Functions to parse specific tags in Apple MakerNote
// Based on some specs in https://exiftool.org/TagNames/Apple.html
// and https://github.com/exiftool/exiftool/blob/master/lib/Image/ExifTool/Apple.pm
// This is based on reverse engineering of Apple MarkerNote as there is no official documentation

type AppleMakerNote = {
    value: number[] | Uint8Array<ArrayBuffer> | ArrayBuffer;
};

/**
 * Safely converts a potential Apple Maker Note to a Uint8Array
 * @param note - The potential maker note object
 * @returns A Uint8Array if valid, undefined otherwise
 */
export const isAppleMakerNote = (note?: unknown): Uint8Array<ArrayBuffer> | undefined => {
    if (!note || typeof note !== 'object' || note === null) {
        return undefined;
    }

    const makerNote = note as Partial<AppleMakerNote>;

    if (
        !makerNote.value ||
        !(
            makerNote.value instanceof Uint8Array ||
            makerNote.value instanceof ArrayBuffer ||
            Array.isArray(makerNote.value)
        )
    ) {
        return undefined;
    }

    try {
        if (makerNote.value instanceof Uint8Array) {
            return makerNote.value;
        } else if (makerNote.value instanceof ArrayBuffer) {
            return new Uint8Array(makerNote.value);
        } else if (Array.isArray(makerNote.value)) {
            return new Uint8Array(makerNote.value);
        } else {
            return undefined;
        }
    } catch (error) {
        console.error('Error converting maker note to Uint8Array:', error);
        return undefined;
    }
};

/**
 * Checks if the maker note has the Apple format
 * @param data - The maker note data
 * @returns boolean indicating if it's Apple format
 */
function checkAppleFormat(data: Uint8Array<ArrayBuffer>): boolean {
    if (data.length < 5) {
        return false;
    }

    return (
        data[0] === 65 && // 'A'
        data[1] === 112 && // 'p'
        data[2] === 112 && // 'p'
        data[3] === 108 && // 'l'
        data[4] === 101 // 'e'
    );
}

/**
 * Extract a 4-byte value from Apple maker note based on a specific tag
 * @param tagToFind - The tag number to search for (e.g., 0x002e for camera type, 0x0014 for image capture type)
 * @param makerNote - The maker note data
 * @returns The extracted 4-byte value, or null if not found
 */
const extractValueFromMakerNote = (tagToFind: number, makerNote?: Uint8Array<ArrayBuffer>): number | null => {
    if (!makerNote || makerNote.length < 20) {
        return null;
    }

    for (let i = 0; i < makerNote.length - 12; i++) {
        const currentTag = (makerNote[i] << 8) | makerNote[i + 1];

        if (currentTag === tagToFind) {
            return (makerNote[i + 8] << 24) | (makerNote[i + 9] << 16) | (makerNote[i + 10] << 8) | makerNote[i + 11];
        }
    }

    return null;
};

/**
 * Finds the CameraType value in the Apple maker note
 * @param makerNote - The maker note data
 * @returns The camera type value (0 = Back Wide, 1 = Back Normal, 6 = Front), or null if not found
 */
const findCameraTypeInMakerNote = (makerNote?: Uint8Array<ArrayBuffer>): number | null => {
    // https://github.com/exiftool/exiftool/blob/master/lib/Image/ExifTool/Apple.pm#L222
    return extractValueFromMakerNote(0x002e, makerNote);
};

/**
 * Get image capture type from Apple maker note
 * @param makerNote - The Apple Maker Note data
 * @returns The image capture type or null if not found
 */
const getImageCaptureType = (makerNote?: Uint8Array<ArrayBuffer>): number | null => {
    // https://github.com/exiftool/exiftool/blob/master/lib/Image/ExifTool/Apple.pm#L123
    return extractValueFromMakerNote(0x0014, makerNote);
};

enum CameraType {
    BackWideAngle = 0,
    BackNormal = 1,
    Front = 6,
}

/**
 * Detects if an image is a selfie by analyzing the Apple Maker Note
 * @param makerNote - The Apple Maker Note as a Uint8Array
 * @returns boolean indicating if the image is a selfie, or null if unable to determine
 */
export const detectSelfieFromMakerNote = (makerNote?: Uint8Array<ArrayBuffer>): boolean => {
    if (!makerNote || makerNote.length < 20) {
        return false;
    }

    const isAppleFormat = checkAppleFormat(makerNote);
    if (!isAppleFormat) {
        return false;
    }

    const cameraType = findCameraTypeInMakerNote(makerNote);
    return cameraType === CameraType.Front;
};

enum ImageCaptureType {
    ProRAW = 1,
    Portrait = 2,
    Photo = 10,
    ManualFocus = 11,
    Scene = 12,
}

/**
 * Detects if an image was taken in Portrait mode by analyzing the Apple Maker Note
 * @param makerNote - The Apple Maker Note as a Uint8Array
 * @returns boolean indicating if the image is a selfie, or null if unable to determine
 */
export const detectPortraitFromMakerNote = (makerNote?: Uint8Array<ArrayBuffer>): boolean => {
    if (!makerNote || makerNote.length < 20) {
        return false;
    }

    const isAppleFormat = checkAppleFormat(makerNote);
    if (!isAppleFormat) {
        return false;
    }

    const captureType = getImageCaptureType(makerNote);
    return captureType === ImageCaptureType.Portrait;
};
