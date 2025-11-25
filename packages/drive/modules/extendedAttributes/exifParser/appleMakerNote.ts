type AppleMakerNote = {
    value: number[] | Uint8Array<ArrayBuffer> | ArrayBuffer;
};

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
        // eslint-disable-next-line no-console
        console.error('Error converting maker note to Uint8Array:', error);
        return undefined;
    }
};

function checkAppleFormat(data: Uint8Array<ArrayBuffer>): boolean {
    if (data.length < 5) {
        return false;
    }

    return data[0] === 65 && data[1] === 112 && data[2] === 112 && data[3] === 108 && data[4] === 101;
}

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

const findCameraTypeInMakerNote = (makerNote?: Uint8Array<ArrayBuffer>): number | null => {
    return extractValueFromMakerNote(0x002e, makerNote);
};

const getImageCaptureType = (makerNote?: Uint8Array<ArrayBuffer>): number | null => {
    return extractValueFromMakerNote(0x0014, makerNote);
};

enum CameraType {
    BackWideAngle = 0,
    BackNormal = 1,
    Front = 6,
}

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
