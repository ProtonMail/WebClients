const BIDI_CONTROLS = /[\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/g;

export const stripBidiControls = (text: string): string => {
    return text.replace(BIDI_CONTROLS, "");
};
