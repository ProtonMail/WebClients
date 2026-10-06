import { type SerializableDeviceInfo, isDefaultDevice } from '@proton/meet/utils/deviceUtils';

const USB_ID = /\(([0-9a-f]{4}:[0-9a-f]{4})\)/i;
const LABEL_TAGS = /\s*\(([0-9a-f]{4}:[0-9a-f]{4}|Bluetooth)\)/gi;
const WINDOWS_PORT_NUMBER = /(^|\()\d+-\s+/g;
const TRAILING_BRACKET = /\s*\([^()]*\)$/;
const WORD = /[\p{L}\p{N}]+/gu;

const getUsbId = (label: string) => USB_ID.exec(label)?.[1].toLowerCase();

const toWords = (label: string) =>
    label.replace(LABEL_TAGS, '').replace(WINDOWS_PORT_NUMBER, '$1').toLowerCase().match(WORD) ?? [];

const containsWords = (words: string[], run: string[]) =>
    run.length > 0 && words.some((_, start) => run.every((word, offset) => words[start + offset] === word));

const audioLabelHoldsCameraName = (audioLabel: string, cameraLabel: string) => {
    const cameraName = cameraLabel.replace(LABEL_TAGS, '').replace(TRAILING_BRACKET, '').trim();

    return cameraName.length > 3 && containsWords(toWords(audioLabel), toWords(cameraName));
};

export const isSameHardware = (one: SerializableDeviceInfo, other: SerializableDeviceInfo): boolean => {
    if (one.groupId && one.groupId === other.groupId && !isDefaultDevice(one.groupId)) {
        return true;
    }

    const usbId = getUsbId(one.label);

    if (usbId && usbId === getUsbId(other.label)) {
        return true;
    }

    if (one.kind === 'videoinput') {
        return other.kind !== 'videoinput' && audioLabelHoldsCameraName(other.label, one.label);
    }

    return other.kind === 'videoinput' && audioLabelHoldsCameraName(one.label, other.label);
};
