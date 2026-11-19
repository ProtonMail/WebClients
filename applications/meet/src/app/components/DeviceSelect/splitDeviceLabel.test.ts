import { splitDeviceLabel } from './splitDeviceLabel';

describe('splitDeviceLabel', () => {
    it('keeps a short trailing group in parentheses visible at the end', () => {
        expect(splitDeviceLabel('MacBook Pro Camera Very Long Name (0000:0001)')).toEqual({
            start: 'MacBook Pro Camera Very Long Name',
            end: ' (0000:0001)',
        });
    });

    it('keeps the last 6 characters at the end when the trailing group is longer than 12 characters', () => {
        expect(splitDeviceLabel('External Microphone (Realtek High Definition)')).toEqual({
            start: 'External Microphone (Realtek High Defin',
            end: 'ition)',
        });
    });

    it('keeps the last 6 characters at the end when the whole label is one group', () => {
        expect(splitDeviceLabel('(0000:0001)')).toEqual({ start: '(0000', end: ':0001)' });
    });

    it('keeps the last 6 characters at the end when there is no trailing group', () => {
        expect(splitDeviceLabel('Studio Display Microphone')).toEqual({ start: 'Studio Display Micr', end: 'ophone' });
    });

    it('does not split a label of 6 characters or fewer', () => {
        expect(splitDeviceLabel('Webcam')).toEqual({ start: 'Webcam', end: '' });
    });

    it('never cuts a code point made of two UTF-16 code units in half', () => {
        expect(splitDeviceLabel('My camera 🎥🎥🎥🎥🎥🎥')).toEqual({ start: 'My camera ', end: '🎥🎥🎥🎥🎥🎥' });
    });
});
