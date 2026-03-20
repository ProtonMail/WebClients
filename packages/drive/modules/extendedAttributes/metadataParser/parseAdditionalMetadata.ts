import type { ParsedAdditionalMetadata } from '../types';

const isObject = (value: unknown): value is Record<string, unknown> => {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const parseString = (value: unknown): string | undefined => {
    return typeof value === 'string' ? value : undefined;
};

const parseNumber = (value: unknown): number | undefined => {
    return typeof value === 'number' && isFinite(value) ? value : undefined;
};

const parseInteger = (value: unknown): number | undefined => {
    const num = parseNumber(value);
    return num !== undefined && Number.isInteger(num) ? num : undefined;
};

const definedOrUndefined = <T extends Record<string, unknown>>(obj: T): T | undefined => {
    return Object.values(obj).some((v) => v !== undefined) ? obj : undefined;
};

const parseSubjectCoordinates = (
    value: unknown
): NonNullable<NonNullable<ParsedAdditionalMetadata['camera']>['subjectCoordinates']> | undefined => {
    if (!isObject(value)) {
        return undefined;
    }
    const top = parseInteger(value.Top);
    const left = parseInteger(value.Left);
    const bottom = parseInteger(value.Bottom);
    const right = parseInteger(value.Right);

    if (top === undefined || left === undefined || bottom === undefined || right === undefined) {
        return undefined;
    }

    return { top, left, bottom, right };
};

const parseLocation = (value: unknown): NonNullable<ParsedAdditionalMetadata['location']> | undefined => {
    if (!isObject(value)) {
        return undefined;
    }
    const latitude = parseNumber(value.Latitude);
    const longitude = parseNumber(value.Longitude);

    if (latitude === undefined || longitude === undefined) {
        return undefined;
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return undefined;
    }

    return { latitude, longitude };
};

const parseOrientation = (value: unknown): number | undefined => {
    const num = parseInteger(value);
    if (num === undefined || num < 1 || num > 8) {
        return undefined;
    }
    return num;
};

export const parseAdditionalMetadata = (rawMetadata: unknown): ParsedAdditionalMetadata => {
    if (!isObject(rawMetadata)) {
        return {};
    }

    const result: ParsedAdditionalMetadata = {};

    if (isObject(rawMetadata.Location)) {
        result.location = parseLocation(rawMetadata.Location);
    }

    if (isObject(rawMetadata.Camera)) {
        const camera = rawMetadata.Camera;
        result.camera = definedOrUndefined({
            captureTime: parseString(camera.CaptureTime),
            device: parseString(camera.Device),
            orientation: parseOrientation(camera.Orientation),
            subjectCoordinates: parseSubjectCoordinates(camera.SubjectCoordinates),
        });
    }

    if (isObject(rawMetadata.Media)) {
        const media = rawMetadata.Media;
        result.media = definedOrUndefined({
            width: parseInteger(media.Width),
            height: parseInteger(media.Height),
            duration: parseNumber(media.Duration),
        });
    }

    if (isObject(rawMetadata['iOS.photos'])) {
        const ios = rawMetadata['iOS.photos'];
        result.iosPhotos = definedOrUndefined({
            iCloudId: parseString(ios.ICloudID),
            modificationTime: parseString(ios.ModificationTime),
        });
    }

    return result;
};
